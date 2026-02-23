import { IsString, IsEnum, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessCategory } from '../schemas/business.schema';

export class CreateBusinessDto {
  @ApiProperty({ example: 'My Salon' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Premium hair and beauty services' })
  @IsString()
  description: string;

  @ApiProperty({ enum: BusinessCategory })
  @IsEnum(BusinessCategory)
  category: BusinessCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  @ApiPropertyOptional()
  @IsOptional()
  workingHours?: Record<string, { open: string; close: string; isOpen: boolean }>;
}
