import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Groq from 'groq-sdk';
import { randomUUID } from 'crypto';

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

type ConversationState = { intent: ExtractedIntent; lastQuestion: string | null };

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  private readonly conversations = new Map<string, ConversationState>();

  constructor(private prisma: PrismaService) {}

  async suggest(
    prompt: string,
    limit = 10,
    sort?: 'price:asc' | 'price:desc' | 'rating:desc',
    conversationId?: string,
    strict?: boolean,
  ) {
    const extracted = await this.extractIntent(prompt);

    const convId = conversationId || randomUUID();
    const previous = this.conversations.get(convId) || null;
    const prevIntent = previous?.intent ?? null;
    const prevLastQ = previous?.lastQuestion ?? null;
    const merged = prevIntent ? this.mergeIntent(prevIntent, extracted) : extracted;
    Object.assign(extracted, merged);

    // Normalize LLM quirks
    if (extracted.transportType === 'null') extracted.transportType = null;
    if (extracted.accommodationLevel === 'null') extracted.accommodationLevel = null;

    // If waiting for a specific answer, parse it first
    if (prevLastQ) this.applyAnswerToIntent(prevLastQ, prompt ?? '', extracted);
    // Parse any mixed entities from the free-form text regardless of last question
    this.applyFreeFormEntities(prompt ?? '', extracted);

    // Month/year fallback and future adjustment
    if (!extracted.month || !extracted.year) {
      const inferred = this.inferMonthYearFromText(prompt ?? '');
      if (inferred.month && inferred.year) {
        extracted.month = inferred.month;
        extracted.year = inferred.year;
      }
    }
    if (extracted.month && extracted.year) {
      const now = new Date();
      const curYear = now.getFullYear();
      const curMonth = now.getMonth() + 1;
      if (extracted.year < curYear || (extracted.year === curYear && extracted.month < curMonth)) {
        extracted.year = extracted.month < curMonth ? curYear + 1 : curYear;
      }
    }

    // Fuzzy-normalize destination/country/continent to known DB values
    const known = await this.getKnownLocationStrings();
    if (extracted.destination) extracted.destination = this.fuzzyBestMatch(extracted.destination, known) ?? extracted.destination;
    if (extracted.country) extracted.country = this.fuzzyBestMatch(extracted.country, known) ?? extracted.country;
    if (extracted.continent) extracted.continent = this.fuzzyBestMatch(extracted.continent, known) ?? extracted.continent;

    // Normalize synonyms to match DB vocabulary
    if (extracted.transportType) {
      const t = extracted.transportType.toLowerCase();
      if (/(plane|air|airplane|flight)/.test(t)) extracted.transportType = 'flight';
      else if (/train/.test(t)) extracted.transportType = 'train';
      else if (/bus/.test(t)) extracted.transportType = 'bus';
    }
    if (extracted.accommodationLevel) {
      const al = extracted.accommodationLevel.toLowerCase();
      if (/(5\s*star|luxury)/.test(al)) extracted.accommodationLevel = 'luxury';
      else if (/(4\s*star|premium)/.test(al)) extracted.accommodationLevel = 'premium';
      else if (/(3\s*star|standard|basic)/.test(al)) extracted.accommodationLevel = 'standard';
    }

    // Build follow-up question list
    const nextQuestions: string[] = [];
    if (!extracted.destination) {
      nextQuestions.push('Any place in mind?');
      this.conversations.set(convId, { intent: extracted, lastQuestion: nextQuestions[0] ?? null });
      const nextQuestion = nextQuestions[0] ?? null;
      const meta = { enoughFilters: false, usedRelaxations: { dateRelaxed: false, budgetRelaxed: false } };
      return { conversationId: convId, extracted, offers: [], nextQuestion, meta };
    }
    if (extracted.budgetMin == null && extracted.budgetMax == null) nextQuestions.push('Any budget range in mind?');
    if (extracted.durationDays == null) nextQuestions.push('How many days do you want to travel?');
    if (!extracted.transportType) nextQuestions.push('Preferred transport type (flight, train, bus)?');
    if (!extracted.accommodationLevel) nextQuestions.push('Preferred accommodation level (standard, premium, luxury)?');
    if (!extracted.month || !extracted.year) nextQuestions.push('When do you want to travel? (month/year)');

    // Compute meta.enoughFilters: destination + at least one of budget/date/duration
    const hasTextFilter = !!extracted.destination;
    const hasDateFilter = !!(extracted.month && extracted.year);
    const hasBudgetFilter = extracted.budgetMax != null || extracted.budgetMin != null;
    const hasDurationFilter = extracted.durationDays != null;
    const hasEnoughFilters = !!(hasTextFilter && (hasBudgetFilter || hasDateFilter || hasDurationFilter));

    // Build Prisma where
    const where: any = {};
    const andClauses: any[] = [];
    andClauses.push({ OR: [{ isActive: true }, { isActive: null }] });
    where.destination = { contains: extracted.destination };
    if (extracted.budgetMin != null && extracted.budgetMax != null) {
      where.price = { gte: Math.max(0, extracted.budgetMin), lte: Math.max(0, extracted.budgetMax) };
    } else if (extracted.budgetMax != null) {
      where.price = { lte: Math.max(0, extracted.budgetMax) };
    } else if (extracted.budgetMin != null) {
      where.price = { gte: Math.max(0, extracted.budgetMin) };
    }
    if (extracted.month && extracted.year) {
      const start = new Date(extracted.year, extracted.month - 1, 1);
      const end = new Date(extracted.year, extracted.month, 0, 23, 59, 59, 999);
      andClauses.push({ startDate: { gte: start, lte: end } });
    }
    if (extracted.transportType) where.transportType = { contains: extracted.transportType };
    if (extracted.accommodationLevel) where.accommodationLevel = { contains: extracted.accommodationLevel };
    if (extracted.durationDays != null) andClauses.push({ durationDays: { lte: extracted.durationDays } });
    if (extracted.mustInclude?.length) {
      const ors = extracted.mustInclude.map((inc) => ({ includes: { string_contains: inc } as any }));
      andClauses.push({ OR: ors });
    }
    if (andClauses.length) where.AND = andClauses;

    const orderBy: any[] = [];
    if (sort === 'price:asc') orderBy.push({ price: 'asc' });
    if (sort === 'price:desc') orderBy.push({ price: 'desc' });
    if (sort === 'rating:desc') orderBy.push({ starRating: 'desc' });

    // Primary search
    let offers = await this.prisma.offer.findMany({ where, orderBy: orderBy.length ? orderBy : [{ price: 'asc' }], take: limit });
    let dateRelaxed = false;
    let budgetRelaxed = false;

    // Soft fallbacks if not strict
    if (!strict && offers.length === 0 && hasDateFilter) {
      const relaxedWhere = { ...where } as any;
      if (relaxedWhere.AND) {
        relaxedWhere.AND = (relaxedWhere.AND as any[]).filter((c) => !('startDate' in c));
      }
      offers = await this.prisma.offer.findMany({ where: relaxedWhere, orderBy: orderBy.length ? orderBy : [{ price: 'asc' }], take: limit });
      dateRelaxed = true;
    }
    if (!strict && offers.length === 0 && extracted.budgetMax != null) {
      const relaxedWhere = { ...where } as any;
      relaxedWhere.price = { lte: Math.max(0, Math.floor(extracted.budgetMax * 1.5)) };
      offers = await this.prisma.offer.findMany({ where: relaxedWhere, orderBy: orderBy.length ? orderBy : [{ price: 'asc' }], take: limit });
      budgetRelaxed = true;
    }

    // Save conversation state and return
    this.conversations.set(convId, { intent: extracted, lastQuestion: nextQuestions[0] ?? null });
    const nextQuestion = nextQuestions[0] ?? null;
    const meta = { enoughFilters: hasEnoughFilters, usedRelaxations: { dateRelaxed, budgetRelaxed } };
    return { conversationId: convId, extracted, offers, nextQuestion, meta };
  }

  private mergeIntent(prev: ExtractedIntent, next: ExtractedIntent): ExtractedIntent {
    return {
      destination: next.destination ?? prev.destination,
      country: next.country ?? prev.country,
      continent: next.continent ?? prev.continent,
      budgetMin: next.budgetMin ?? prev.budgetMin,
      budgetMax: next.budgetMax ?? prev.budgetMax,
      durationDays: next.durationDays ?? prev.durationDays,
      month: next.month ?? prev.month,
      year: next.year ?? prev.year,
      transportType: next.transportType ?? prev.transportType,
      accommodationLevel: next.accommodationLevel ?? prev.accommodationLevel,
      peopleCount: next.peopleCount ?? prev.peopleCount,
      mustInclude: (next.mustInclude?.length ? next.mustInclude : prev.mustInclude) ?? [],
      niceToHave: (next.niceToHave?.length ? next.niceToHave : prev.niceToHave) ?? [],
      notes: next.notes ?? prev.notes,
    };
  }

  private applyAnswerToIntent(lastQuestion: string, answer: string, intent: ExtractedIntent) {
    const a = (answer ?? '').toString().trim().toLowerCase();
    if (!a) return;
    if (/place in mind|where.*go|destination/i.test(lastQuestion)) {
      if (answer.trim().length > 0) intent.destination = answer.trim();
    }
    if (/budget/i.test(lastQuestion)) {
      const nums = a.match(/\d{2,6}/g)?.map((n) => Number(n)) || [];
      if (nums.length >= 2) {
        const [min, max] = nums[0] <= nums[1] ? [nums[0], nums[1]] : [nums[1], nums[0]];
        intent.budgetMin = min;
        intent.budgetMax = max;
      } else if (nums.length === 1) {
        if (/(at least|minimum|min|from)/.test(a)) intent.budgetMin = nums[0];
        else intent.budgetMax = nums[0];
      }
    }
    if (/how many days|duration/i.test(lastQuestion)) {
      const d = a.match(/\d{1,3}/);
      if (d) intent.durationDays = Math.max(1, Number(d[0]));
    }
    if (/when do you want to travel|when.*travel|month\/?year/i.test(lastQuestion)) {
      const m = this.inferMonthYearFromText(answer);
      if (m.month) intent.month = m.month;
      if (m.year) intent.year = m.year;
    }
    if (/transport/i.test(lastQuestion)) {
      if (/flight|plane|air/.test(a)) intent.transportType = 'flight';
      else if (/train/.test(a)) intent.transportType = 'train';
      else if (/bus/.test(a)) intent.transportType = 'bus';
    }
    if (/accommodation|hotel|level/i.test(lastQuestion)) {
      if (/luxury|5\s*star/.test(a)) intent.accommodationLevel = 'luxury';
      else if (/premium|4\s*star/.test(a)) intent.accommodationLevel = 'premium';
      else if (/standard|3\s*star|basic/.test(a)) intent.accommodationLevel = 'standard';
    }
  }

  private applyFreeFormEntities(text: string, intent: ExtractedIntent) {
    const t = (text ?? '').toString();
    const a = t.toLowerCase();
    if (!a) return;
    // Duration: if present, overwrite (detect early to avoid confusing with budget)
    {
      const m = a.match(/(\d{1,3})\s*(days?|d)\b/) || a.match(/^\s*(\d{1,3})\s*$/);
      if (m) intent.durationDays = Math.max(1, Number(m[1] ?? m[0]));
    }

    // Budget: only update when explicit budget/price cues or currency symbols exist
    {
      const hasBudgetCue = /(budget|price|cost|under|below|less than|at most|at least|minimum|min|max|around|about|~|approximately|\$|€|£|usd|eur|egp)/i.test(a);
      if (hasBudgetCue) {
        // Remove 'X days' phrases from consideration
        const budgetStr = a.replace(/\b\d{1,3}\s*(days?|d)\b/g, '');
        // Range patterns: 1000-1200 or 1000 to 1200
        const range = budgetStr.match(/(\d{2,6})\s*(?:-|to)\s*(\d{2,6})/);
        if (range) {
          const n1 = Number(range[1]);
          const n2 = Number(range[2]);
          const [min, max] = n1 <= n2 ? [n1, n2] : [n2, n1];
          intent.budgetMin = min;
          intent.budgetMax = max;
        } else {
          const nums = budgetStr.match(/\d{2,6}/g)?.map(Number) || [];
          if (nums.length >= 2) {
            const [min, max] = nums[0] <= nums[1] ? [nums[0], nums[1]] : [nums[1], nums[0]];
            intent.budgetMin = min;
            intent.budgetMax = max;
          } else if (nums.length === 1) {
            if (/(at least|minimum|min|from|>=)/.test(budgetStr)) intent.budgetMin = nums[0];
            else intent.budgetMax = nums[0];
          }
        }
      }
    }

    // Transport: choose the last-mentioned type in this prompt
    {
      const matches = Array.from(a.matchAll(/\b(flight|plane|air|train|bus)\b/g));
      if (matches.length) {
        const last = matches[matches.length - 1][1];
        if (/flight|plane|air/.test(last)) intent.transportType = 'flight';
        else if (/train/.test(last)) intent.transportType = 'train';
        else if (/bus/.test(last)) intent.transportType = 'bus';
      }
    }
    // Date: if month/year info is present, overwrite
    {
      const inf = this.inferMonthYearFromText(t);
      if (inf.month) intent.month = inf.month;
      if (inf.year) intent.year = inf.year;
    }
    // Accommodation: choose the last-mentioned level; support simple negation like "not premium"
    {
      // Remove negated terms to avoid false positives (e.g., "not premium")
      const cleaned = a.replace(/not\s+(luxury|premium|standard|5\s*star|4\s*star|3\s*star|basic)/g, '');
      const matches = Array.from(cleaned.matchAll(/\b(luxury|premium|standard|5\s*star|4\s*star|3\s*star|basic)\b/g));
      if (matches.length) {
        const last = matches[matches.length - 1][1];
        if (/luxury|5\s*star/.test(last)) intent.accommodationLevel = 'luxury';
        else if (/premium|4\s*star/.test(last)) intent.accommodationLevel = 'premium';
        else if (/standard|3\s*star|basic/.test(last)) intent.accommodationLevel = 'standard';
      }
    }
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
      required: [],
      additionalProperties: false,
    } as const;

    try {
      const res = await this.groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Extract travel intent into STRICT JSON matching the provided JSON Schema. If the user did not clearly specify a value, set it to null and DO NOT GUESS. Do not include any prose.' },
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

  private fallbackExtract(prompt: string): ExtractedIntent {
    const mBudget = (prompt ?? '').match(/\$?(\d{2,6})/);
    const mDest = (prompt ?? '').match(/to\s+([A-Za-z\-\s]+?)(?:\s+with|\s+for|\.|,|$)/i);
    const mNextMonth = /next month/i.test(prompt ?? '');
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

  private inferMonthYearFromText(text: string): { month: number | null; year: number | null } {
    const safe = (text ?? '').toString();
    const months = [
      'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december',
      'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec'
    ];
    const lower = safe.toLowerCase();
    let monthIndex: number | null = null;
    for (let i = 0; i < months.length; i++) {
      const m = months[i];
      if (lower.includes(m)) { monthIndex = (i % 12) + 1; break; }
    }
    const now = new Date();
    const saysNext = /\bnext\b/.test(lower);
    let year: number | null = null;
    const yMatch = lower.match(/(20\d{2})/);
    if (yMatch) year = Number(yMatch[1]);
    if (monthIndex) {
      if (!year) {
        const curMonth = now.getMonth() + 1;
        const curYear = now.getFullYear();
        year = saysNext ? (monthIndex <= curMonth ? curYear + 1 : curYear) : (monthIndex < curMonth ? curYear + 1 : curYear);
      }
      return { month: monthIndex, year };
    }
    if (/next month/.test(lower)) {
      const m = ((now.getMonth() + 1) % 12) + 1;
      const y = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
      return { month: m, year: y };
    }
    return { month: null, year: null };
  }

  private async getKnownLocationStrings(): Promise<string[]> {
    const offers = await this.prisma.offer.findMany({ select: { title: true, destination: true, country: true, continent: true }, take: 500 });
    const set = new Set<string>();
    for (const o of offers) {
      [o.title, o.destination, o.country, o.continent].filter((v): v is string => !!v && typeof v === 'string').forEach((v) => set.add(v));
    }
    return Array.from(set);
  }

  private fuzzyBestMatch(input: string, candidates: string[]): string | null {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const a = norm(input);
    if (!a) return null;
    let best: { s: string; score: number } | null = null;
    for (const c of candidates) {
      const b = norm(c);
      const d = this.levenshtein(a, b);
      const maxLen = Math.max(a.length, b.length) || 1;
      const sim = 1 - d / maxLen;
      if (!best || sim > best.score) best = { s: c, score: sim };
    }
    return best && best.score >= 0.6 ? best.s : null;
  }

  private levenshtein(a: string, b: string): number {
    const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }
    return dp[a.length][b.length];
  }
}
