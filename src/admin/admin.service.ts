import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { CreateAdminOfferDto } from './dto/create-admin-offer.dto';
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  createPackage(dto: CreatePackageDto) {
    return this.prisma.package.create({
      data: {
        offerId: dto.offerId ?? null,
        transportId: dto.transportId ?? null,
        price: dto.price,
      },
    });
  }

  createOffer(dto: CreateAdminOfferDto) {
    return this.prisma.offer.create({
      data: {
        title: dto.title,
        description: dto.description,
        price: dto.price,
        seats: dto.seats,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        destination: dto.destination,
        kind: dto.kind,
        companyId: dto.companyId,
      },
    });
  }

  createCompany(dto: CreateCompanyDto) {
    return this.prisma.company.create({ data: dto });
  }

  listCompanies() {
    return this.prisma.company.findMany({ include: { offers: true, transports: true, reviews: true } });
  }

  async dashboard() {
    const [bookings, offersCount, transportsCount, companiesCount, reviewsCount] = await Promise.all([
      this.prisma.booking.findMany({ include: { offer: true, transport: true } }),
      this.prisma.offer.count(),
      this.prisma.transport.count(),
      this.prisma.company.count(),
      this.prisma.review.count(),
    ]);

    const revenue = bookings.reduce((sum, b) => {
      if (b.status !== 'CONFIRMED') return sum;
      const offerPrice = (b as any).offer?.price ?? 0;
      const transportPrice = (b as any).transport?.price ?? 0;
      return sum + offerPrice + transportPrice;
    }, 0);

    return {
      companies: companiesCount,
      offers: offersCount,
      transports: transportsCount,
      bookings: bookings.length,
      reviews: reviewsCount,
      revenue,
    };
  }
}
