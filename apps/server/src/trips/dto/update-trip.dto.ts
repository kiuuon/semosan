import { IsDateString, IsString, MinLength } from 'class-validator';

export class UpdateTripDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
