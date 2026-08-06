import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Min } from 'class-validator';

import { TOUR_CONTENT_TYPE_IDS } from '../../common/constants/place';

export type LegalDongRegion = {
  lDongRegnCd: string;
  lDongSignguCd?: string;
};

/** `11:215,41:170` 또는 `11` 형식 */
const REGIONS_PARAM_PATTERN = /^(\d{2}(:\d{3})?)(,\d{2}(:\d{3})?)*$/;

export function parseRegionsParam(regions: string): LegalDongRegion[] {
  return regions
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [lDongRegnCd, lDongSignguCd] = part.split(':');
      return {
        lDongRegnCd,
        ...(lDongSignguCd ? { lDongSignguCd } : {}),
      };
    });
}

export class SearchPlacesDto {
  @IsString()
  @IsNotEmpty({ message: '검색 지역을 입력해 주세요.' })
  @Matches(REGIONS_PARAM_PATTERN, { message: '검색 지역 형식이 올바르지 않습니다.' })
  regions!: string;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsIn(TOUR_CONTENT_TYPE_IDS, { message: '관광 타입 ID가 올바르지 않습니다.' })
  contentTypeId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;
}
