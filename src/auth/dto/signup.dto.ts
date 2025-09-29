import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { CompanyType, UserRole } from '@prisma/client';

export class SignupDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role!: UserRole;

  // Traveler fields
  @ApiProperty({ required: false, description: 'Traveler name (required if role=TRAVELER)' })
  @IsOptional()
  @IsString()
  name?: string;

  // Company fields
  @ApiProperty({ required: false, description: 'Company name (required if role=COMPANY)' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ required: false, enum: CompanyType, description: 'Company type (required if role=COMPANY)' })
  @IsOptional()
  @IsEnum(CompanyType)
  companyType?: CompanyType;

}
