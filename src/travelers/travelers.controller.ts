import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TravelersService } from './travelers.service';
import { CreateTravelerDto } from './dto/create-traveler.dto';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Travelers')
@Controller('travelers')
export class TravelersController {
  constructor(private readonly travelersService: TravelersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a traveler' })
  @ApiOkResponse({ description: 'Traveler created successfully' })
  create(@Body() dto: CreateTravelerDto) {
    return this.travelersService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get traveler by ID' })
  @ApiOkResponse({ description: 'Traveler retrieved successfully' })
  findOne(@Param('id') id: string) {
    return this.travelersService.findOne(+id);
  }
}
