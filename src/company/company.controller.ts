import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { CreateTransportDto } from './dto/create-transport.dto';
import { UpdateTransportDto } from './dto/update-transport.dto';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Company')
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post('offers')
  @ApiOperation({ summary: 'Create a new offer' })
  @ApiBody({ type: CreateOfferDto })
  @ApiCreatedResponse({ description: 'Offer created successfully' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  addOffer(@Body() dto: CreateOfferDto) {
    return this.companyService.addOffer(dto);
  }

  @Put('offers/:id')
  @ApiOperation({ summary: 'Update an existing offer' })
  @ApiParam({ name: 'id', type: String, description: 'Offer ID' })
  @ApiBody({ type: UpdateOfferDto })
  @ApiOkResponse({ description: 'Offer updated successfully' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  updateOffer(@Param('id') id: string, @Body() dto: UpdateOfferDto) {
    return this.companyService.updateOffer(+id, dto);
  }

  @Post('transport_options')
  @ApiOperation({ summary: 'Create a new transport option' })
  @ApiBody({ type: CreateTransportDto })
  @ApiCreatedResponse({ description: 'Transport option created successfully' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  addTransport(@Body() dto: CreateTransportDto) {
    return this.companyService.addTransport(dto);
  }

  @Put('transport_options/:id')
  @ApiOperation({ summary: 'Update a transport option' })
  @ApiParam({ name: 'id', type: String, description: 'Transport option ID' })
  @ApiBody({ type: UpdateTransportDto })
  @ApiOkResponse({ description: 'Transport option updated successfully' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  updateTransport(@Param('id') id: string, @Body() dto: UpdateTransportDto) {
    return this.companyService.updateTransport(+id, dto);
  }

  @Get('dashboard/:id')
  @ApiOperation({ summary: 'Get company dashboard metrics' })
  @ApiParam({ name: 'id', type: String, description: 'Company ID' })
  @ApiOkResponse({ description: 'Dashboard data retrieved successfully' })
  getDashboard(@Param('id') id: string) {
    return this.companyService.dashboard(+id);
  }

  @Get('bookings/:id')
  @ApiOperation({ summary: 'Get company bookings' })
  @ApiParam({ name: 'id', type: String, description: 'Company ID' })
  @ApiOkResponse({ description: 'Bookings retrieved successfully' })
  getBookings(@Param('id') id: string) {
    return this.companyService.bookings(+id);
  }
}

