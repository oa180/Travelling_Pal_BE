import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Groq from 'groq-sdk';
import { Prisma } from '@prisma/client';

export type ExtractedIntent = {
  destination: string | null;
  country: string | null;
  continent: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  durationDays: number | null;
  month: number | null; // 1-12
  year: number | null; // YYYY
  transportType: string | null;
  accommodationLevel: string | null;
  peopleCount: number | null;
  mustInclude: string[];
  niceToHave: string[];
  notes: string | null;
};

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  constructor(private prisma: PrismaService) {}

  async suggest(prompt: string, limit = 10, sort?: 'price:asc' | 'price:desc' | 'rating:desc') {
    const extracted = await this.extractIntent(prompt);
    // Normalize some LLM quirks
    if (extracted.transportType === 'null') extracted.transportType = null;
    if (extracted.accommodationLevel === 'null') extracted.accommodationLevel = null;
    // Ensure month/year target is not in the past; if so, move to the next future occurrence of that month
    if (extracted.month && extracted.year) {
      const now = new Date();
      const curYear = now.getFullYear();
      const curMonth = now.getMonth() + 1; // 1-12
      if (extracted.year < curYear || (extracted.year === curYear && extracted.month < curMonth)) {
        extracted.year = extracted.month < curMonth ? curYear + 1 : curYear;
      }
    }
    const where: any = {};
    const andClauses: any[] = [];
    // Accept offers that are active or where flag is null (legacy rows)
    andClauses.push({ OR: [{ isActive: true }, { isActive: null }] });

    if (extracted.destination) {
      where.destination = { contains: extracted.destination };
    } else if (extracted.country) {
      where.country = { contains: extracted.country };
    } else if (extracted.continent) {
      where.continent = { contains: extracted.continent };
    }

    if (extracted.budgetMax != null) {
      where.price = { lte: Math.max(0, extracted.budgetMax) };
    } else if (extracted.budgetMin != null) {
      where.price = { gte: Math.max(0, extracted.budgetMin) };
    }

    // Date constraint (month/year) against startDate OR availableDates JSON array
    if (extracted.month && extracted.year) {
      const start = new Date(extracted.year, (extracted.month - 1), 1);
      const end = new Date(extracted.year, (extracted.month - 1) + 1, 0, 23, 59, 59, 999);
      andClauses.push({ startDate: { gte: start, lte: end } });
    }

    if (extracted.transportType) where.transportType = { contains: extracted.transportType };
    if (extracted.accommodationLevel) where.accommodationLevel = { contains: extracted.accommodationLevel };

    // includes JSON array should contain all mustInclude terms if provided
    if (extracted.mustInclude?.length) {
      // Prisma JSON filters differ by DB; for MySQL we can fallback to contains on stringified array terms
      // Implement a simple OR filter: any of the includes terms appears
      const ors = extracted.mustInclude.map((inc) => ({ includes: { string_contains: inc } as any }));
      andClauses.push({ OR: ors });
    }

    if (andClauses.length) where.AND = andClauses;

    const orderBy: any[] = [];
    if (sort === 'price:asc') orderBy.push({ price: 'asc' });
    if (sort === 'price:desc') orderBy.push({ price: 'desc' });
    if (sort === 'rating:desc') orderBy.push({ starRating: 'desc' });

    // If we have destination/country/continent or date/budget filters, prefer raw SQL for strict case-insensitive behavior (MySQL)
    const hasTextFilter = !!(extracted.destination || extracted.country || extracted.continent);
    const hasDateFilter = !!(extracted.month && extracted.year);
    const hasBudgetFilter = extracted.budgetMax != null || extracted.budgetMin != null;

    if (hasTextFilter || hasDateFilter || hasBudgetFilter) {
      const buildQuery = (opts: { disableDate?: boolean; relaxBudget?: boolean }) => {
        const clauses: Prisma.Sql[] = [];

        // Active or legacy rows
        clauses.push(Prisma.sql`(isActive = 1 OR isActive IS NULL)`);

        // Text filter
        const searchText = extracted.destination ?? extracted.country ?? extracted.continent;
        if (searchText) {
          clauses.push(
            Prisma.sql`(
              LOWER(title) LIKE CONCAT('%', LOWER(${searchText}), '%')
              OR LOWER(destination) LIKE CONCAT('%', LOWER(${searchText}), '%')
              OR LOWER(country) LIKE CONCAT('%', LOWER(${searchText}), '%')
              OR LOWER(continent) LIKE CONCAT('%', LOWER(${searchText}), '%')
            )`,
          );
        }

        // Budget filter
        if (extracted.budgetMax != null) {
          const max = Math.max(0, extracted.budgetMax * (opts.relaxBudget ? 1.5 : 1));
          clauses.push(Prisma.sql`price <= ${max}`);
        } else if (extracted.budgetMin != null) {
          clauses.push(Prisma.sql`price >= ${Math.max(0, extracted.budgetMin)}`);
        }

        // Date month filter: startDate in month OR availableMonths contains 'YYYY-MM'
        if (hasDateFilter && !opts.disableDate) {
          const monthStr = `${extracted.year}-${String(extracted.month).padStart(2, '0')}`;
          const monthStart = new Date(extracted.year!, extracted.month! - 1, 1);
          const monthEnd = new Date(extracted.year!, extracted.month!, 0, 23, 59, 59, 999);
          clauses.push(
            Prisma.sql`(
              (startDate >= ${monthStart} AND startDate <= ${monthEnd})
              OR (availableMonths IS NOT NULL AND JSON_CONTAINS(availableMonths, JSON_QUOTE(${monthStr})))
            )`,
          );
        }

        // Additional optional filters for transport/accommodation (case-insensitive)
        if (extracted.transportType) {
          clauses.push(Prisma.sql`LOWER(transportType) LIKE CONCAT('%', LOWER(${extracted.transportType}), '%')`);
        }
        if (extracted.accommodationLevel) {
          clauses.push(Prisma.sql`LOWER(accommodationLevel) LIKE CONCAT('%', LOWER(${extracted.accommodationLevel}), '%')`);
        }

        // includes: any match (best-effort)
        if (extracted.mustInclude?.length) {
          const ors = extracted.mustInclude.map((inc) => Prisma.sql`(includes IS NOT NULL AND JSON_SEARCH(includes, 'one', ${inc}) IS NOT NULL)`);
          clauses.push(Prisma.sql`(${Prisma.join(ors, ' OR ')})`);
        }

        const whereSql = clauses.length ? Prisma.sql`WHERE ${Prisma.join(clauses, ' AND ')}` : Prisma.sql``;
        let orderSql = Prisma.sql`ORDER BY price ASC`;
        if (sort === 'price:desc') orderSql = Prisma.sql`ORDER BY price DESC`;
        if (sort === 'rating:desc') orderSql = Prisma.sql`ORDER BY starRating DESC`;
        const sql = Prisma.sql`SELECT * FROM Offer ${whereSql} ${orderSql} LIMIT ${limit}`;
        return sql;
      };

      // Try strict query
      let sql = buildQuery({});
      let offers = await this.prisma.$queryRaw<any[]>(sql);
      if (offers.length === 0 && hasDateFilter) {
        // Retry without date
        sql = buildQuery({ disableDate: true });
        offers = await this.prisma.$queryRaw<any[]>(sql);
      }
      if (offers.length === 0 && hasBudgetFilter && extracted.budgetMax != null) {
        // Retry with relaxed budget (+20%)
        sql = buildQuery({ relaxBudget: true });
        offers = await this.prisma.$queryRaw<any[]>(sql);
      }
      if (offers.length === 0) {
        // Final fallback: ignore date and budget, only text filter + active
        sql = buildQuery({ disableDate: true, relaxBudget: true });
        offers = await this.prisma.$queryRaw<any[]>(sql);
      }
      return { extracted, offers };
    }

    // Fallback simple query
    const offers = await this.prisma.offer.findMany({ where, orderBy: orderBy.length ? orderBy : [{ price: 'asc' }], take: limit });
    return { extracted, offers };
  }

  private async extractIntent(prompt: string): Promise<ExtractedIntent> {
    const schema = {
      type: 'object',
      properties: {
        destination: { type: ['string', 'null'] },
        country: { type: ['string', 'null'] },
        continent: { type: ['string', 'null'] },
        budgetMin: { type: ['number', 'null'] },
        budgetMax: { type: ['number', 'null'] },
        durationDays: { type: ['number', 'null'] },
        month: { type: ['number', 'null'] },
        year: { type: ['number', 'null'] },
        transportType: { type: ['string', 'null'] },
        accommodationLevel: { type: ['string', 'null'] },
        peopleCount: { type: ['number', 'null'] },
        mustInclude: { type: 'array', items: { type: 'string' } },
        niceToHave: { type: 'array', items: { type: 'string' } },
        notes: { type: ['string', 'null'] },
      },
      required: ['destination','country','continent','budgetMin','budgetMax','durationDays','month','year','transportType','accommodationLevel','peopleCount','mustInclude','niceToHave','notes'],
      additionalProperties: false,
    } as const;

    try {
      const res = await this.groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Extract travel intent into STRICT JSON that conforms exactly to the provided JSON Schema. Do not include any prose.' },
          { role: 'user', content: `User prompt: ${prompt}\n\nReturn JSON matching this schema: ${JSON.stringify(schema)}` },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' } as any,
      });

      const text = res.choices?.[0]?.message?.content || '{}';
      const parsed = JSON.parse(text);
      return this.normalizeIntent(parsed);
    } catch (err) {
      this.logger.warn(`LLM extraction failed, falling back. Err: ${String(err)}`);
      return this.fallbackExtract(prompt);
    }
  }

  private normalizeIntent(obj: any): ExtractedIntent {
    const num = (v: any) => (typeof v === 'number' && !Number.isNaN(v) ? v : null);
    const str = (v: any) => (typeof v === 'string' && v.trim() ? v.trim() : null);
    const arr = (v: any) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()) : []);

    return {
      destination: str(obj.destination),
      country: str(obj.country),
      continent: str(obj.continent),
      budgetMin: num(obj.budgetMin),
      budgetMax: num(obj.budgetMax),
      durationDays: num(obj.durationDays),
      month: num(obj.month),
      year: num(obj.year),
      transportType: str(obj.transportType),
      accommodationLevel: str(obj.accommodationLevel),
      peopleCount: num(obj.peopleCount),
      mustInclude: arr(obj.mustInclude),
      niceToHave: arr(obj.niceToHave),
      notes: str(obj.notes),
    };
  }

  // Very light fallback heuristics if the LLM fails
  private fallbackExtract(prompt: string): ExtractedIntent {
    const mBudget = prompt.match(/\$?(\d{2,6})/);
    const mDest = prompt.match(/to\s+([A-Za-z\-\s]+?)(?:\s+with|\s+for|\.|,|$)/i);
    const mNextMonth = /next month/i.test(prompt);
    const now = new Date();
    const month = mNextMonth ? ((now.getMonth() + 1) % 12) + 1 : null;
    const year = mNextMonth ? (now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear()) : null;

    return {
      destination: mDest ? mDest[1].trim() : null,
      country: null,
      continent: null,
      budgetMin: null,
      budgetMax: mBudget ? Number(mBudget[1]) : null,
      durationDays: null,
      month,
      year,
      transportType: null,
      accommodationLevel: null,
      peopleCount: null,
      mustInclude: [],
      niceToHave: [],
      notes: null,
    };
  }
}
