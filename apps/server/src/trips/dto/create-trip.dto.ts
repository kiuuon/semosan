import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';

export class CreateTripMountainDto {
  @IsString()
  @MinLength(1)
  externalId: string;

  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  region: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class CreateTripDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @ValidateNested()
  @Type(() => CreateTripMountainDto)
  mountain: CreateTripMountainDto;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
