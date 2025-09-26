import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ChatSuggestDto {
  @ApiProperty({ example: 'I want to go to Hurghada with $1000 budget next month' })
  @IsString()
  prompt!: string;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiProperty({ example: 'price:asc', required: false, description: 'Supported: price:asc|price:desc|rating:desc' })
  @IsOptional()
  @IsString()
  sort?: 'price:asc' | 'price:desc' | 'rating:desc';
}
