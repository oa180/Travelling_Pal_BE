import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class SearchOffersDto {
  @IsOptional()
  @IsString()
  destination?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  budgetMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  budgetMax?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
