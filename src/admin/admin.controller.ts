import { Body, Controller, Get, Post } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { CreateAdminOfferDto } from './dto/create-admin-offer.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('packages')
  @ApiOperation({ summary: 'Create a package' })
  @ApiOkResponse({ description: 'Package created successfully' })
  createPackage(@Body() dto: CreatePackageDto) {
    return this.adminService.createPackage(dto);
  }

  @Post('offers')
  @ApiOperation({ summary: 'Create an offer (admin)' })
  @ApiOkResponse({ description: 'Offer created successfully' })
  createOffer(@Body() dto: CreateAdminOfferDto) {
    return this.adminService.createOffer(dto);
  }

  @Post('companies')
  @ApiOperation({ summary: 'Create a company' })
  @ApiOkResponse({ description: 'Company created successfully' })
  createCompany(@Body() dto: CreateCompanyDto) {
    return this.adminService.createCompany(dto);
  }

  @Get('companies')
  @ApiOperation({ summary: 'List companies' })
  @ApiOkResponse({ description: 'Companies listed successfully' })
  listCompanies() {
    return this.adminService.listCompanies();
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard' })
  @ApiOkResponse({ description: 'Dashboard retrieved successfully' })
  dashboard() {
    return this.adminService.dashboard();
  }
}
