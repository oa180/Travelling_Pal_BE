import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a review' })
  @ApiOkResponse({ description: 'Review created successfully' })
  create(@Body() dto: CreateReviewDto) {
    return this.reviewsService.create(dto);
  }

  @Get('company/:companyId')
  @ApiOperation({ summary: 'List reviews for a company' })
  @ApiOkResponse({ description: 'Reviews retrieved successfully' })
  forCompany(@Param('companyId') companyId: string) {
    return this.reviewsService.forCompany(+companyId);
  }
}
