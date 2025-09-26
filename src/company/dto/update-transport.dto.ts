import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTransportDto {
  @ApiPropertyOptional({ example: 'train' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 'Giza' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ example: 'Aswan' })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsInt()
  @Min(0)
  seats?: number;
}
