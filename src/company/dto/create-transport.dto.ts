import { IsInt, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransportDto {
  @ApiProperty({ example: 'bus', description: 'Transport type' })
  @IsString()
  type!: string; // bus, flight, train

  @ApiProperty({ example: 'Cairo' })
  @IsString()
  from!: string;

  @ApiProperty({ example: 'Alexandria' })
  @IsString()
  to!: string;

  @ApiProperty({ example: 150 })
  @IsInt()
  @Min(0)
  price!: number;

  @ApiProperty({ example: 45 })
  @IsInt()
  @Min(0)
  seats!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  companyId!: number;
}
