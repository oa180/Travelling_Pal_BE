import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchOffersDto } from './dto/search-offers.dto';
import { CheckoutDto } from './dto/checkout.dto';

@Injectable()
export class PublicService {
  constructor(private prisma: PrismaService) {}

  getOffers() {
    return this.prisma.offer.findMany({
      include: { company: true },
      orderBy: { createdAt: 'desc' },
    } as any);
  }

  async getOfferById(id: number) {
    const offer = await this.prisma.offer.update({
      where: { id },
      data: { clicks: { increment: 1 } },
      include: { company: true },
    });
    return offer;
  }

  getTransportOptions() {
    return this.prisma.transport.findMany({ include: { company: true } });
  }

  async getTransportById(id: number) {
    const transport = await this.prisma.transport.update({
      where: { id },
      data: { clicks: { increment: 1 } },
      include: { company: true },
    });
    return transport;
  }

  async searchOffers(dto: SearchOffersDto) {
    const { budgetMin, budgetMax, startDate, endDate, destination } = dto;
    const offers = await this.prisma.offer.findMany({
      where: {
        destination: destination ? { contains: destination } : undefined,
        price: {
          gte: budgetMin ?? undefined,
          lte: budgetMax ?? undefined,
        },
        startDate: startDate ? { gte: new Date(startDate) } : undefined,
        endDate: endDate ? { lte: new Date(endDate) } : undefined,
      },
      include: { company: true },
      take: 100,
    });

    // track impressions for offers returned
    if (offers.length) {
      await this.prisma.offer.updateMany({
        where: { id: { in: offers.map((o) => o.id) } },
        data: { impressions: { increment: 1 } },
      });

      // Log impression entries for analytics
      await this.prisma.impression.createMany({
        data: offers.map((o) => ({ offerId: o.id })),
        skipDuplicates: true,
      });
    }

    return offers;
  }

  async checkout(dto: CheckoutDto) {
    // Mock payment URL - in production, integrate with a PSP
    return {
      url: `https://payments.example.com/checkout?bookingId=${encodeURIComponent(dto.bookingId)}`,
    };
  }
}
