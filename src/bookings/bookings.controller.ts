import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a booking' })
  @ApiOkResponse({ description: 'Booking created successfully' })
  create(@Body() dto: CreateBookingDto) {
    return this.bookingsService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiOkResponse({ description: 'Booking retrieved successfully' })
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(+id);
  }
}
