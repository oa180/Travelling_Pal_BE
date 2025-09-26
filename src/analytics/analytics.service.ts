import { Injectable } from '@nestjs/common';
import { Prisma, BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  // Public analytics
  async topDestinations() {
    // Count confirmed bookings grouped by offer.destination
    const bookings = await this.prisma.booking.findMany({
      where: { status: BookingStatus.CONFIRMED, offer: { destination: { not: null } } },
      include: { offer: true },
    });
    const map = new Map<string, number>();
    for (const b of bookings) {
      const dest = b.offer?.destination ?? 'Unknown';
      map.set(dest, (map.get(dest) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([destination, bookings]) => ({ destination, bookings }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 20);
  }

  async topCompanies() {
    // Rank by bookings and reviews
    const [bookings, reviews] = await Promise.all([
      this.prisma.booking.findMany({ where: { status: BookingStatus.CONFIRMED }, include: { offer: true, transport: true } }),
      this.prisma.review.findMany(),
    ]);
    const metrics = new Map<number, { companyId: number; bookings: number; reviews: number }>();
    for (const b of bookings) {
      const companyId = b.offer?.companyId ?? b.transport?.companyId;
      if (!companyId) continue;
      const m = metrics.get(companyId) ?? { companyId, bookings: 0, reviews: 0 };
      m.bookings += 1;
      metrics.set(companyId, m);
    }
    for (const r of reviews) {
      const m = metrics.get(r.companyId) ?? { companyId: r.companyId, bookings: 0, reviews: 0 };
      m.reviews += 1;
      metrics.set(r.companyId, m);
    }
    // Attach company details
    const companyIds = Array.from(metrics.keys());
    const companies = await this.prisma.company.findMany({ where: { id: { in: companyIds } } });
    return companies
      .map((c) => ({ companyId: c.id, name: c.name, ...metrics.get(c.id)! }))
      .sort((a, b) => b.bookings - a.bookings || b.reviews - a.reviews)
      .slice(0, 20);
  }

  async trendingOffers() {
    // Offers with most impressions in last 7 days from Impression logs
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const logs = await this.prisma.impression.groupBy({
      by: ['offerId'],
      where: { createdAt: { gte: since } },
      _count: { offerId: true },
      orderBy: { _count: { offerId: 'desc' } },
      take: 20,
    });
    const offers = await this.prisma.offer.findMany({ where: { id: { in: logs.map((l) => l.offerId) } } });
    const byId = new Map(offers.map((o) => [o.id, o]));
    return logs.map((l) => ({ offerId: l.offerId, title: byId.get(l.offerId)?.title ?? 'Unknown', impressions7d: l._count.offerId }));
  }

  // Traveler analytics
  async travelerAnalytics(travelerId: number) {
    const bookings = await this.prisma.booking.findMany({
      where: { travelerId, status: BookingStatus.CONFIRMED },
      include: { offer: true, transport: true },
    });
    const totalTrips = bookings.length;
    const totalSpent = bookings.reduce((sum, b) => sum + (b.offer?.price ?? 0) + (b.transport?.price ?? 0), 0);
    const ratings = await this.prisma.review.findMany({ where: { travelerId } });
    const avgRatingGiven = ratings.length ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;
    return { totalTrips, totalSpent, avgRatingGiven };
  }

  // Company analytics
  async companyAnalytics(companyId: number) {
    const [offers, transports, reviews, bookings] = await Promise.all([
      this.prisma.offer.findMany({ where: { companyId } }),
      this.prisma.transport.findMany({ where: { companyId } }),
      this.prisma.review.findMany({ where: { companyId } }),
      this.prisma.booking.findMany({ where: { OR: [{ offer: { companyId } }, { transport: { companyId } }], status: BookingStatus.CONFIRMED }, include: { offer: true, transport: true } }),
    ]);

    const impressions = offers.reduce((s, o) => s + (o as any).impressions, 0) + transports.reduce((s, t) => s + (t as any).impressions, 0);
    const clicks = offers.reduce((s, o) => s + (o as any).clicks, 0) + transports.reduce((s, t) => s + (t as any).clicks, 0);
    const confirmedBookings = bookings.length;
    const conversionRate = clicks ? (confirmedBookings / clicks) * 100 : 0;
    const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

    // top offers by bookings
    const offerCounts = new Map<number, number>();
    for (const b of bookings) {
      if (b.offerId) offerCounts.set(b.offerId, (offerCounts.get(b.offerId) ?? 0) + 1);
    }
    const sorted = Array.from(offerCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const topOffers = sorted.map(([offerId, bookings]) => ({ offerId, title: offers.find((o) => o.id === offerId)?.title ?? 'Unknown', bookings }));

    return { impressions, clicks, bookings: confirmedBookings, conversionRate, avgRating, topOffers };
  }

  async companyOffersAnalytics(companyId: number) {
    const offers = await this.prisma.offer.findMany({ where: { companyId } });
    const bookings = await this.prisma.booking.findMany({ where: { offer: { companyId }, status: BookingStatus.CONFIRMED }, include: { offer: true } });

    const map = new Map<number, { offerId: number; title: string; bookings: number; seatsLeft: number; revenue: number }>();
    for (const o of offers) {
      map.set(o.id, { offerId: o.id, title: o.title, bookings: 0, seatsLeft: o.seats, revenue: 0 });
    }
    for (const b of bookings) {
      const m = map.get(b.offerId!);
      if (!m) continue;
      m.bookings += 1;
      m.seatsLeft = Math.max(0, m.seatsLeft - 1);
      m.revenue += b.offer?.price ?? 0;
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }

  async companyTransportsAnalytics(companyId: number) {
    const transports = await this.prisma.transport.findMany({ where: { companyId } });
    const bookings = await this.prisma.booking.findMany({ where: { transport: { companyId }, status: BookingStatus.CONFIRMED }, include: { transport: true } });
    const map = new Map<number, { transportId: number; type: string; from: string; to: string; bookings: number; utilization: number; revenue: number }>();
    for (const t of transports) {
      map.set(t.id, { transportId: t.id, type: t.type, from: t.from, to: t.to, bookings: 0, utilization: 0, revenue: 0 });
    }
    for (const b of bookings) {
      const m = map.get(b.transportId!);
      if (!m) continue;
      m.bookings += 1;
      m.revenue += b.transport?.price ?? 0;
    }
    // utilization per option = bookings / seats * 100
    for (const t of transports) {
      const m = map.get(t.id)!;
      m.utilization = t.seats ? (m.bookings / t.seats) * 100 : 0;
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }

  // Admin analytics
  async adminOverview() {
    const [travelers, companies, bookings, reviews] = await Promise.all([
      this.prisma.traveler.count(),
      this.prisma.company.count(),
      this.prisma.booking.findMany({ where: { status: BookingStatus.CONFIRMED }, include: { offer: true, transport: true } }),
      this.prisma.review.findMany(),
    ]);
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.offer?.price ?? 0) + (b.transport?.price ?? 0), 0);
    const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    return {
      totalTravelers: travelers,
      totalCompanies: companies,
      totalBookings: bookings.length,
      totalRevenue,
      avgRating,
    };
  }

  async adminCompanies() {
    const companies = await this.prisma.company.findMany();
    const bookings = await this.prisma.booking.findMany({ where: { status: BookingStatus.CONFIRMED }, include: { offer: true, transport: true } });
    const reviews = await this.prisma.review.findMany();
    const map = new Map<number, { companyId: number; name: string; revenue: number; bookings: number; rating: number }>();
    for (const c of companies) {
      map.set(c.id, { companyId: c.id, name: c.name, revenue: 0, bookings: 0, rating: 0 });
    }
    for (const b of bookings) {
      const companyId = b.offer?.companyId ?? b.transport?.companyId;
      if (!companyId) continue;
      const m = map.get(companyId)!;
      m.bookings += 1;
      m.revenue += (b.offer?.price ?? 0) + (b.transport?.price ?? 0);
    }
    const byCompanyReviews = new Map<number, number[]>();
    for (const r of reviews) {
      const arr = byCompanyReviews.get(r.companyId) ?? [];
      arr.push(r.rating);
      byCompanyReviews.set(r.companyId, arr);
    }
    for (const [companyId, arr] of byCompanyReviews.entries()) {
      const m = map.get(companyId);
      if (m) m.rating = arr.reduce((s, x) => s + x, 0) / arr.length;
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue || b.bookings - a.bookings || b.rating - a.rating);
  }

  async adminDestinations() {
    const bookings = await this.prisma.booking.findMany({ where: { status: BookingStatus.CONFIRMED }, include: { offer: true } });
    const map = new Map<string, number>();
    for (const b of bookings) {
      const dest = b.offer?.destination ?? 'Unknown';
      map.set(dest, (map.get(dest) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([destination, bookings]) => ({ destination, bookings }));
  }

  async adminTimeseries(interval: 'day' | 'week' | 'month' = 'month') {
    const bookings = await this.prisma.booking.findMany({ where: { status: BookingStatus.CONFIRMED }, include: { offer: true, transport: true } });
    // bucket by interval
    function keyFor(d: Date) {
      const y = d.getUTCFullYear();
      const m = d.getUTCMonth() + 1;
      const day = d.getUTCDate();
      if (interval === 'day') return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (interval === 'week') {
        // simple ISO week approximation
        const tmp = new Date(Date.UTC(y, d.getUTCMonth(), d.getUTCDate()));
        const dayNum = (tmp.getUTCDay() + 6) % 7; // Monday=0
        tmp.setUTCDate(tmp.getUTCDate() - dayNum + 3);
        const firstThursday = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 4));
        const week = Math.round(((tmp.getTime() - firstThursday.getTime()) / 86400000 - 3) / 7) + 1;
        return `${y}-W${String(week).padStart(2, '0')}`;
      }
      return `${y}-${String(m).padStart(2, '0')}`; // month
    }

    const buckets = new Map<string, { date: string; bookings: number; revenue: number }>();
    for (const b of bookings) {
      const k = keyFor(b.createdAt);
      const item = buckets.get(k) ?? { date: k, bookings: 0, revenue: 0 };
      item.bookings += 1;
      item.revenue += (b.offer?.price ?? 0) + (b.transport?.price ?? 0);
      buckets.set(k, item);
    }
    return Array.from(buckets.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
  }
}
