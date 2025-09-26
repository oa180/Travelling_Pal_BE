import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PublicService } from './public.service';
import { SearchOffersDto } from './dto/search-offers.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Public')
@Controller()
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('offers')
  @ApiOperation({ summary: 'List public offers' })
  @ApiOkResponse({ description: 'Offers retrieved successfully' })
  getOffers() {
    return this.publicService.getOffers();
  }

  @Get('offers/:id')
  @ApiOperation({ summary: 'Get public offer by ID' })
  @ApiOkResponse({ description: 'Offer retrieved successfully' })
  getOffer(@Param('id') id: string) {
    return this.publicService.getOfferById(+id);
  }

  @Get('transport_options')
  @ApiOperation({ summary: 'List public transport options' })
  @ApiOkResponse({ description: 'Transport options retrieved successfully' })
  getTransportOptions() {
    return this.publicService.getTransportOptions();
  }

  @Get('transport_options/:id')
  @ApiOperation({ summary: 'Get transport option by ID' })
  @ApiOkResponse({ description: 'Transport option retrieved successfully' })
  getTransportOption(@Param('id') id: string) {
    return this.publicService.getTransportById(+id);
  }

  @Post('search_offers')
  @ApiOperation({ summary: 'Search offers' })
  @ApiOkResponse({ description: 'Search executed successfully' })
  searchOffers(@Body() dto: SearchOffersDto) {
    return this.publicService.searchOffers(dto);
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Checkout' })
  @ApiOkResponse({ description: 'Checkout executed successfully' })
  checkout(@Body() dto: CheckoutDto) {
    return this.publicService.checkout(dto);
  }
}
