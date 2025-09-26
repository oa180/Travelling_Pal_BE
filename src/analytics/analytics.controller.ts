import { Controller, Get, Param, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Analytics')
@Controller()
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  // Public analytics
  @Get('analytics/top-destinations')
  @ApiOperation({ summary: 'Get top destinations' })
  @ApiOkResponse({ description: 'Top destinations retrieved successfully' })
  topDestinations() {
    return this.analytics.topDestinations();
  }

  @Get('analytics/top-companies')
  @ApiOperation({ summary: 'Get top companies' })
  @ApiOkResponse({ description: 'Top companies retrieved successfully' })
  topCompanies() {
    return this.analytics.topCompanies();
  }

  @Get('analytics/trending-offers')
  @ApiOperation({ summary: 'Get trending offers' })
  @ApiOkResponse({ description: 'Trending offers retrieved successfully' })
  trendingOffers() {
    return this.analytics.trendingOffers();
  }

  // Traveler analytics
  @Get('travelers/:id/analytics')
  @ApiOperation({ summary: 'Get analytics for a traveler' })
  @ApiOkResponse({ description: 'Traveler analytics retrieved successfully' })
  travelerAnalytics(@Param('id') id: string) {
    return this.analytics.travelerAnalytics(+id);
  }

  // Company analytics
  @Get('company/:id/analytics')
  @ApiOperation({ summary: 'Get analytics for a company' })
  @ApiOkResponse({ description: 'Company analytics retrieved successfully' })
  companyAnalytics(@Param('id') id: string) {
    return this.analytics.companyAnalytics(+id);
  }

  @Get('company/:id/analytics/offers')
  @ApiOperation({ summary: 'Get company offers analytics' })
  @ApiOkResponse({ description: 'Company offers analytics retrieved successfully' })
  companyOffersAnalytics(@Param('id') id: string) {
    return this.analytics.companyOffersAnalytics(+id);
  }

  @Get('company/:id/analytics/transports')
  @ApiOperation({ summary: 'Get company transports analytics' })
  @ApiOkResponse({ description: 'Company transports analytics retrieved successfully' })
  companyTransportsAnalytics(@Param('id') id: string) {
    return this.analytics.companyTransportsAnalytics(+id);
  }

  // Admin analytics
  @Get('admin/analytics/overview')
  @ApiOperation({ summary: 'Get admin analytics overview' })
  @ApiOkResponse({ description: 'Admin overview retrieved successfully' })
  adminOverview() {
    return this.analytics.adminOverview();
  }

  @Get('admin/analytics/companies')
  @ApiOperation({ summary: 'Get admin companies analytics' })
  @ApiOkResponse({ description: 'Admin companies analytics retrieved successfully' })
  adminCompanies() {
    return this.analytics.adminCompanies();
  }

  @Get('admin/analytics/destinations')
  @ApiOperation({ summary: 'Get admin destinations analytics' })
  @ApiOkResponse({ description: 'Admin destinations analytics retrieved successfully' })
  adminDestinations() {
    return this.analytics.adminDestinations();
  }

  @Get('admin/analytics/timeseries')
  @ApiOperation({ summary: 'Get admin analytics timeseries' })
  @ApiOkResponse({ description: 'Admin timeseries retrieved successfully' })
  adminTimeseries(@Query('interval') interval: 'day' | 'month' | 'week' = 'month') {
    return this.analytics.adminTimeseries(interval);
  }
}
