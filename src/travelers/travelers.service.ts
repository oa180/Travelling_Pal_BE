import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTravelerDto } from './dto/create-traveler.dto';

@Injectable()
export class TravelersService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateTravelerDto) {
    return this.prisma.traveler.create({ data: dto });
  }

  async findOne(id: number) {
    const traveler = await this.prisma.traveler.findUnique({
      where: { id },
      include: {
        bookings: { include: { offer: true, transport: true } },
        reviews: true,
      },
    });
    if (!traveler) throw new NotFoundException('Traveler not found');
    return traveler;
  }
}
