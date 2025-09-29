import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { CreateTransportDto } from './dto/create-transport.dto';
import { UpdateTransportDto } from './dto/update-transport.dto';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  addOffer(dto: CreateOfferDto) {
    const data = {
      title: dto.title,
      description: dto.description,
      price: dto.price,
      seats: dto.seats,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      destination: dto.destination,
      kind: dto.kind,
      companyId: dto.companyId,
      // Enriched + snake_case aliases
      originalPrice: dto.originalPrice ?? (dto as any).original_price,
      imageUrl: dto.imageUrl ?? (dto as any).image_url,
      availableDates: dto.availableDates ?? (dto as any).available_dates,
      durationDays: dto.durationDays ?? (dto as any).duration_days,
      starRating: dto.starRating ?? (dto as any).star_rating,
      transportType: dto.transportType ?? (dto as any).transport_type,
      accommodationLevel:
        dto.accommodationLevel ?? (dto as any).accommodation_level,
      maxTravelers: dto.maxTravelers ?? (dto as any).max_travelers,
      includes: dto.includes ?? (dto as any).includes_snake ?? dto.includes,
      providerId: dto.providerId ?? (dto as any).provider_id,
      providerName: dto.providerName ?? (dto as any).provider_name,
      isActive: dto.isActive ?? (dto as any).is_active,
      country: dto.country,
      continent: dto.continent,
    } as const;

    return this.prisma.offer.create({ data });
  }

  updateOffer(id: number, dto: UpdateOfferDto) {
    const partial: Record<string, any> = {};

    // Core fields
    if ('title' in dto) partial.title = dto.title;
    if ('description' in dto) partial.description = dto.description;
    if ('price' in dto) partial.price = dto.price;
    if ('seats' in dto) partial.seats = dto.seats;
    if ('destination' in dto) partial.destination = dto.destination;
    if ('startDate' in dto && dto.startDate)
      partial.startDate = new Date(dto.startDate);
    if ('endDate' in dto && dto.endDate) partial.endDate = new Date(dto.endDate);

    // Enriched (camelCase)
    if ('originalPrice' in dto) partial.originalPrice = dto.originalPrice;
    if ('imageUrl' in dto) partial.imageUrl = dto.imageUrl;
    if ('availableDates' in dto) partial.availableDates = dto.availableDates;
    if ('durationDays' in dto) partial.durationDays = dto.durationDays;
    if ('starRating' in dto) partial.starRating = dto.starRating;
    if ('transportType' in dto) partial.transportType = dto.transportType;
    if ('accommodationLevel' in dto)
      partial.accommodationLevel = dto.accommodationLevel;
    if ('maxTravelers' in dto) partial.maxTravelers = dto.maxTravelers;
    if ('includes' in dto) partial.includes = dto.includes;
    if ('providerId' in dto) partial.providerId = dto.providerId;
    if ('providerName' in dto) partial.providerName = dto.providerName;
    if ('isActive' in dto) partial.isActive = dto.isActive;
    if ('country' in dto) partial.country = dto.country;
    if ('continent' in dto) partial.continent = dto.continent;

    // snake_case aliases
    const anyDto = dto as any;
    if ('original_price' in anyDto) partial.originalPrice = anyDto.original_price;
    if ('image_url' in anyDto) partial.imageUrl = anyDto.image_url;
    if ('available_dates' in anyDto) partial.availableDates = anyDto.available_dates;
    if ('duration_days' in anyDto) partial.durationDays = anyDto.duration_days;
    if ('star_rating' in anyDto) partial.starRating = anyDto.star_rating;
    if ('transport_type' in anyDto) partial.transportType = anyDto.transport_type;
    if ('accommodation_level' in anyDto)
      partial.accommodationLevel = anyDto.accommodation_level;
    if ('max_travelers' in anyDto) partial.maxTravelers = anyDto.max_travelers;
    if ('includes_snake' in anyDto) partial.includes = anyDto.includes_snake;
    if ('provider_id' in anyDto) partial.providerId = anyDto.provider_id;
    if ('provider_name' in anyDto) partial.providerName = anyDto.provider_name;
    if ('is_active' in anyDto) partial.isActive = anyDto.is_active;

    return this.prisma.offer.update({ where: { id }, data: partial });
  }

  addTransport(dto: CreateTransportDto) {
    return this.prisma.transport.create({
      data: {
        type: dto.type,
        from: dto.from,
        to: dto.to,
        price: dto.price,
        seats: dto.seats,
        companyId: dto.companyId,
      },
    });
  }

  updateTransport(id: number, dto: UpdateTransportDto) {
    return this.prisma.transport.update({
      where: { id },
      data: {
        ...('type' in dto ? { type: dto.type } : {}),
        ...('from' in dto ? { from: dto.from } : {}),
        ...('to' in dto ? { to: dto.to } : {}),
        ...('price' in dto ? { price: dto.price } : {}),
        ...('seats' in dto ? { seats: dto.seats } : {}),
      },
    });
  }

  async dashboard(companyId: number) {
    const [offers, transports, reviews, bookingsCount] = await Promise.all([
      this.prisma.offer.findMany({ where: { companyId } }),
      this.prisma.transport.findMany({ where: { companyId } }),
      this.prisma.review.findMany({ where: { companyId } }),
      this.prisma.booking.count({
        where: { OR: [{ offer: { companyId } }, { transport: { companyId } }] },
      }),
    ]);

    const impressions =
      offers.reduce((sum, o) => sum + (o as any).impressions, 0) +
      transports.reduce((sum, t) => sum + (t as any).impressions, 0);
    const clicks =
      offers.reduce((sum, o) => sum + (o as any).clicks, 0) +
      transports.reduce((sum, t) => sum + (t as any).clicks, 0);

    return {
      offers: offers.length,
      transports: transports.length,
      reviews: reviews.length,
      bookings: bookingsCount,
      impressions,
      clicks,
      averageRating:
        reviews.length > 0
          ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
          : 0,
    };
  }

  bookings(companyId: number) {
    return this.prisma.booking.findMany({
      where: { OR: [{ offer: { companyId } }, { transport: { companyId } }] },
      include: { traveler: true, offer: true, transport: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- Analytics helpers
  private parseDateRange(from?: string, to?: string) {
    const now = new Date();
    const end = to ? new Date(to) : now;
    const start = from ? new Date(from) : new Date(end.getTime() - 7 * 24 * 3600 * 1000);
    // Normalize to avoid invalid ranges
    if (start > end) return { start: end, end: start };
    return { start, end };
  }

  private dayKey(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private monthKey(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  // --- Analytics: Summary
  async analyticsSummary(params: { from?: string; to?: string; packageId?: string; destination?: string; companyId?: string }) {
    const { start, end } = this.parseDateRange(params.from, params.to);
    const companyId = params.companyId ? Number(params.companyId) : undefined;
    const offerWhere: any = { };
    if (companyId) offerWhere.companyId = companyId;
    if (params.destination) offerWhere.destination = { contains: params.destination };
    if (params.packageId) offerWhere.id = Number(params.packageId);

    const [offers, bookingsAll] = await Promise.all([
      this.prisma.offer.findMany({ where: offerWhere }),
      this.prisma.booking.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          OR: [
            { offer: companyId ? { companyId } : {} },
            { transport: companyId ? { companyId } : {} },
          ],
        },
        include: { offer: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Filter bookings to selected package/destination if provided
    const bookings = bookingsAll.filter((b) => {
      const o = b.offer;
      if (!o) return false; // count only offer bookings for analytics
      if (params.packageId && o.id !== Number(params.packageId)) return false;
      if (params.destination && !(o.destination || '').includes(params.destination)) return false;
      return true;
    });

    // Totals
    const confirmed = bookings.filter((b) => b.status === 'CONFIRMED');
    const revenueTotal = confirmed.reduce((s, b) => s + (b.offer?.price || 0), 0);
    const bookingsTotal = confirmed.length;

    // Impressions/Clicks from offers
    const impressions = offers.reduce((s, o) => s + ((o as any).impressions || 0), 0);
    const clicks = offers.reduce((s, o) => s + ((o as any).clicks || 0), 0);

    const conversionDen = impressions > 0 ? impressions : (clicks > 0 ? clicks : 1);
    const conversionRate = bookingsTotal / conversionDen;
    const aov = bookingsTotal > 0 ? revenueTotal / bookingsTotal : 0;

    // Funnel: "bookingStarts" = all bookings regardless of status in range
    const funnel = {
      impressions,
      clicks,
      bookingStarts: bookings.length,
      bookings: bookingsTotal,
    };

    // Time series
    const revenueSeriesMap = new Map<string, number>();
    const bookingsSeriesMap = new Map<string, number>();
    for (const b of bookings) {
      const key = this.dayKey(b.createdAt);
      const price = b.offer?.price || 0;
      revenueSeriesMap.set(key, (revenueSeriesMap.get(key) || 0) + (b.status === 'CONFIRMED' ? price : 0));
      bookingsSeriesMap.set(key, (bookingsSeriesMap.get(key) || 0) + (b.status === 'CONFIRMED' ? 1 : 0));
    }
    const toSeries = (map: Map<string, number>) =>
      Array.from(map.entries())
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .map(([date, value]) => ({ date, value }));

    const timeSeries = {
      revenue: toSeries(revenueSeriesMap),
      bookings: toSeries(bookingsSeriesMap),
      impressions: impressions ? [{ date: this.dayKey(end), value: impressions }] : [],
      clicks: clicks ? [{ date: this.dayKey(end), value: clicks }] : [],
    };

    // By month and status distribution
    const byMonthMap = new Map<string, number>();
    const statusMap = new Map<string, number>();
    for (const b of bookings) {
      const month = this.monthKey(b.createdAt);
      byMonthMap.set(month, (byMonthMap.get(month) || 0) + (b.status === 'CONFIRMED' ? 1 : 0));
      statusMap.set(b.status.toLowerCase(), (statusMap.get(b.status.toLowerCase()) || 0) + 1);
    }
    const byMonth = Array.from(byMonthMap.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([month, bookings]) => ({ month, bookings }));
    const statusDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));

    return {
      revenueTotal,
      bookingsTotal,
      conversionRate,
      aov,
      impressions,
      clicks,
      funnel,
      timeSeries,
      byMonth,
      statusDistribution,
    };
  }

  // --- Analytics: Top packages
  async topPackages(params: { from?: string; to?: string; sort?: 'revenue' | 'bookings' | 'ctr'; limit?: number; companyId?: string }) {
    const { start, end } = this.parseDateRange(params.from, params.to);
    const companyId = params.companyId ? Number(params.companyId) : undefined;

    const offers = await this.prisma.offer.findMany({ where: companyId ? { companyId } : {}, select: { id: true, title: true, impressions: true, clicks: true, price: true } });
    const offerMap = new Map<number, { title: string; impressions: number; clicks: number; price: number }>();
    for (const o of offers) offerMap.set(o.id, { title: o.title, impressions: (o as any).impressions || 0, clicks: (o as any).clicks || 0, price: o.price });

    const bookings = await this.prisma.booking.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        offer: companyId ? { companyId } : { },
      },
      include: { offer: true },
    });

    const map = new Map<number, { title: string; revenue: number; bookings: number; impressions: number; clicks: number }>();
    for (const b of bookings) {
      const o = b.offer;
      if (!o) continue;
      const cur = map.get(o.id) || { title: o.title, revenue: 0, bookings: 0, impressions: (o as any).impressions || 0, clicks: (o as any).clicks || 0 };
      if (b.status === 'CONFIRMED') {
        cur.revenue += o.price;
        cur.bookings += 1;
      }
      map.set(o.id, cur);
    }

    let items = Array.from(map.entries()).map(([id, v]) => {
      const ctr = v.impressions ? v.clicks / v.impressions : 0;
      const aov = v.bookings ? v.revenue / v.bookings : 0;
      return { packageId: String(id), title: v.title, revenue: v.revenue, bookings: v.bookings, impressions: v.impressions, clicks: v.clicks, ctr, aov };
    });

    const sort = params.sort || 'revenue';
    items.sort((a, b) => (b[sort] as number) - (a[sort] as number));
    items = items.slice(0, params.limit || 20);
    return { items };
  }

  // --- Analytics: Recent bookings
  async recentBookings(params: { from?: string; to?: string; limit?: number; companyId?: string }) {
    const { start, end } = this.parseDateRange(params.from, params.to);
    const companyId = params.companyId ? Number(params.companyId) : undefined;
    const itemsRaw = await this.prisma.booking.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        OR: [
          { offer: companyId ? { companyId } : {} },
          { transport: companyId ? { companyId } : {} },
        ],
      },
      include: { offer: true, traveler: true },
      orderBy: { createdAt: 'desc' },
      take: params.limit || 20,
    });
    const items = itemsRaw.map((b) => ({
      id: String(b.id),
      packageId: b.offer ? String(b.offer.id) : null,
      packageTitle: b.offer?.title || null,
      price: b.offer?.price || 0,
      status: String(b.status).toLowerCase(),
      createdAt: b.createdAt.toISOString(),
      customer: { country: (b.traveler as any)?.country || null },
    }));
    return { items };
  }

  // --- Utility: Packages dropdown
  async packages(params: { query?: string; companyId?: string }) {
    const companyId = params.companyId ? Number(params.companyId) : undefined;
    const where: any = companyId ? { companyId } : {};
    if (params.query) where.title = { contains: params.query };
    const items = await this.prisma.offer.findMany({ where, select: { id: true, title: true }, orderBy: { title: 'asc' }, take: 100 });
    return { items: items.map((o) => ({ id: String(o.id), title: o.title })) };
  }

  // --- Utility: Destinations dropdown
  async destinations(params: { companyId?: string }) {
    const companyId = params.companyId ? Number(params.companyId) : undefined;
    const rows = await this.prisma.offer.findMany({ where: companyId ? { companyId } : {}, select: { destination: true }, distinct: ['destination'] });
    const items = rows
      .map((r) => r.destination)
      .filter((d): d is string => !!d)
      .sort()
      .map((d) => ({ value: d, label: d }));
    return { items };
  }
}
