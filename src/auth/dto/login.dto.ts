import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsMobilePhone, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  // Keeping flexible; optionally use IsMobilePhone('any') if needed
  mobile?: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password!: string;
}
