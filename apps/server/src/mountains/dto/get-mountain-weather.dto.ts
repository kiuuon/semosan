import { IsOptional, Matches } from 'class-validator';

import { GetMountainDetailDto } from './get-mountain-detail.dto';

export class GetMountainWeatherDto extends GetMountainDetailDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '시작일은 YYYY-MM-DD 형식이어야 합니다.' })
  startDate?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '종료일은 YYYY-MM-DD 형식이어야 합니다.' })
  endDate?: string;
}
