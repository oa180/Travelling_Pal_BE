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
}
