import { IsDateString, IsEnum, IsInt, IsString, Min } from 'class-validator';
import { OfferKind } from '@prisma/client';

export class CreateAdminOfferDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsInt()
  @Min(0)
  price!: number;

  @IsInt()
  @Min(0)
  seats!: number;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsString()
  destination!: string;

  @IsEnum(OfferKind)
  kind!: OfferKind;

  @IsInt()
  companyId!: number;
}
