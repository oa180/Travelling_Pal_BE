import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBookingDto) {
    if (!dto.offerId && !dto.transportId) {
      throw new BadRequestException('Provide offerId or transportId');
    }
    const booking = await this.prisma.booking.create({
      data: {
        travelerId: dto.travelerId,
        offerId: dto.offerId ?? null,
        transportId: dto.transportId ?? null,
      },
      include: { offer: true, transport: true },
    });

    // Track clicks on the selected item(s)
    if (booking.offerId) {
      await this.prisma.offer.update({
        where: { id: booking.offerId },
        data: { clicks: { increment: 1 } },
      });
    }
    if (booking.transportId) {
      await this.prisma.transport.update({
        where: { id: booking.transportId },
        data: { clicks: { increment: 1 } },
      });
    }
    return booking;
  }

  async findOne(id: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { traveler: true, offer: true, transport: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }
}
