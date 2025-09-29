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
import { Query } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

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

  // Analytics: summary
  @UseGuards(JwtAuthGuard)
  @Get('analytics/summary')
  @ApiOperation({ summary: 'Analytics summary for company offers' })
  @ApiOkResponse({ description: 'Summary computed successfully' })
  summary(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('packageId') packageId?: string,
    @Query('destination') destination?: string,
    @Query('companyId') companyId?: string,
    @CurrentUser() user?: { companyId?: number | null },
  ) {
    const scopedCompanyId = companyId ?? (user?.companyId != null ? String(user.companyId) : undefined);
    return this.companyService.analyticsSummary({ from, to, packageId, destination, companyId: scopedCompanyId });
  }

  // Analytics: top packages
  @UseGuards(JwtAuthGuard)
  @Get('analytics/top-packages')
  @ApiOperation({ summary: 'Top packages by revenue/bookings/ctr' })
  @ApiOkResponse({ description: 'Top packages computed successfully' })
  topPackages(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('sort') sort: 'revenue' | 'bookings' | 'ctr' = 'revenue',
    @Query('limit') limit = '20',
    @Query('companyId') companyId?: string,
    @CurrentUser() user?: { companyId?: number | null },
  ) {
    const scopedCompanyId = companyId ?? (user?.companyId != null ? String(user.companyId) : undefined);
    return this.companyService.topPackages({ from, to, sort, limit: Number(limit), companyId: scopedCompanyId });
  }

  // Analytics: recent bookings
  @UseGuards(JwtAuthGuard)
  @Get('analytics/recent-bookings')
  @ApiOperation({ summary: 'Recent bookings list' })
  @ApiOkResponse({ description: 'Recent bookings retrieved successfully' })
  recentBookings(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit = '20',
    @Query('companyId') companyId?: string,
    @CurrentUser() user?: { companyId?: number | null },
  ) {
    const scopedCompanyId = companyId ?? (user?.companyId != null ? String(user.companyId) : undefined);
    return this.companyService.recentBookings({ from, to, limit: Number(limit), companyId: scopedCompanyId });
  }

  // Packages dropdown
  @UseGuards(JwtAuthGuard)
  @Get('packages')
  @ApiOperation({ summary: 'List packages (offers) for dropdown' })
  @ApiOkResponse({ description: 'Packages retrieved successfully' })
  packages(
    @Query('query') query?: string,
    @Query('companyId') companyId?: string,
    @CurrentUser() user?: { companyId?: number | null },
  ) {
    const scopedCompanyId = companyId ?? (user?.companyId != null ? String(user.companyId) : undefined);
    return this.companyService.packages({ query, companyId: scopedCompanyId });
  }

  // Destinations dropdown
  @UseGuards(JwtAuthGuard)
  @Get('destinations')
  @ApiOperation({ summary: 'List destinations for dropdown' })
  @ApiOkResponse({ description: 'Destinations retrieved successfully' })
  destinations(
    @Query('companyId') companyId?: string,
    @CurrentUser() user?: { companyId?: number | null },
  ) {
    const scopedCompanyId = companyId ?? (user?.companyId != null ? String(user.companyId) : undefined);
    return this.companyService.destinations({ companyId: scopedCompanyId });
  }
}

