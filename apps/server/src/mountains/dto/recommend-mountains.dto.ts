import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

import {
  ALLOWED_MOUNTAIN_SEASON_CODES,
  ALLOWED_MOUNTAIN_THEME_CODES,
  type MountainSeasonCode,
  type MountainThemeCode,
} from '../constants/mountain-recommend';

export class RecommendMountainsDto {
  @IsOptional()
  @IsIn(ALLOWED_MOUNTAIN_SEASON_CODES, { message: '유효하지 않은 계절 코드입니다.' })
  season?: MountainSeasonCode;

  @IsOptional()
  @IsIn(ALLOWED_MOUNTAIN_THEME_CODES, { message: '유효하지 않은 주제 코드입니다.' })
  theme?: MountainThemeCode;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;
}
