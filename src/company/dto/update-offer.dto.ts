import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOfferDto {
  @ApiPropertyOptional({ example: 'Updated title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 1099 })
  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsInt()
  @Min(0)
  seats?: number;

  @ApiPropertyOptional({ example: '2025-07-02' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-07-09' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'Ubud, Bali' })
  @IsOptional()
  @IsString()
  destination?: string;

  // Enriched optional fields (camelCase)
  @ApiPropertyOptional({ example: 1099 })
  @IsOptional()
  @IsInt()
  originalPrice?: number;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ type: [String], example: ['2025-10-05', '2025-11-12'] })
  @IsOptional()
  @IsArray()
  availableDates?: string[];

  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  @IsInt()
  durationDays?: number;

  @ApiPropertyOptional({ example: 4.8 })
  @IsOptional()
  @IsNumber()
  starRating?: number;

  @ApiPropertyOptional({ example: 'flight' })
  @IsOptional()
  @IsString()
  transportType?: string;

  @ApiPropertyOptional({ example: 'standard' })
  @IsOptional()
  @IsString()
  accommodationLevel?: string;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsInt()
  maxTravelers?: number;

  @ApiPropertyOptional({ type: [String], example: ['Flights', 'Hotel'] })
  @IsOptional()
  @IsArray()
  includes?: string[];

  @ApiPropertyOptional({ example: 'prov_1' })
  @IsOptional()
  @IsString()
  providerId?: string;

  @ApiPropertyOptional({ example: 'Island Tours' })
  @IsOptional()
  @IsString()
  providerName?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'Indonesia' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'Asia' })
  @IsOptional()
  @IsString()
  continent?: string;

  // snake_case aliases
  @ApiPropertyOptional({ example: 1099 })
  @IsOptional()
  @IsInt()
  original_price?: number;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiPropertyOptional({ type: [String], example: ['2025-10-05', '2025-11-12'] })
  @IsOptional()
  @IsArray()
  available_dates?: string[];

  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  @IsInt()
  duration_days?: number;

  @ApiPropertyOptional({ example: 4.8 })
  @IsOptional()
  @IsNumber()
  star_rating?: number;

  @ApiPropertyOptional({ example: 'flight' })
  @IsOptional()
  @IsString()
  transport_type?: string;

  @ApiPropertyOptional({ example: 'standard' })
  @IsOptional()
  @IsString()
  accommodation_level?: string;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsInt()
  max_travelers?: number;

  @ApiPropertyOptional({ type: [String], example: ['Flights', 'Hotel'] })
  @IsOptional()
  @IsArray()
  includes_snake?: string[];

  @ApiPropertyOptional({ example: 'prov_1' })
  @IsOptional()
  @IsString()
  provider_id?: string;

  @ApiPropertyOptional({ example: 'Island Tours' })
  @IsOptional()
  @IsString()
  provider_name?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
