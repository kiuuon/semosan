import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

import { MountainSearchType } from '../types/mountain-search-type';

export class SearchMountainsDto {
  @IsString()
  @IsNotEmpty({ message: '검색어를 입력해 주세요.' })
  keyword: string;

  @IsEnum(MountainSearchType, { message: '검색 타입은 name 또는 region 이어야 합니다.' })
  type: MountainSearchType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;
}
