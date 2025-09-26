import { Module } from '@nestjs/common';
import { TravelersController } from './travelers.controller';
import { TravelersService } from './travelers.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TravelersController],
  providers: [TravelersService],
  exports: [TravelersService],
})
export class TravelersModule {}
