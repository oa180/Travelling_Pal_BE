import { IsInt, IsOptional, Min } from 'class-validator';

export class CreatePackageDto {
  @IsOptional()
  @IsInt()
  offerId?: number;

  @IsOptional()
  @IsInt()
  transportId?: number;

  @IsInt()
  @Min(0)
  price!: number;
}
