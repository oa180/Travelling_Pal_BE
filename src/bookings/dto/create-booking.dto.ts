import { IsInt, IsOptional } from 'class-validator';

export class CreateBookingDto {
  @IsInt()
  travelerId!: number;

  @IsOptional()
  @IsInt()
  offerId?: number;

  @IsOptional()
  @IsInt()
  transportId?: number;
}
