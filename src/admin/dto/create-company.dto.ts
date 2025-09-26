import { IsEnum, IsString, MinLength } from 'class-validator';
import { CompanyType } from '@prisma/client';

export class CreateCompanyDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEnum(CompanyType)
  type!: CompanyType;
}
