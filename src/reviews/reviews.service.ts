import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateReviewDto) {
    return this.prisma.review.create({ data: dto });
  }

  forCompany(companyId: number) {
    return this.prisma.review.findMany({ where: { companyId }, include: { traveler: true } });
  }
}
