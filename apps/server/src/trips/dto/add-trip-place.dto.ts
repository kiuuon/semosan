import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

import { TOUR_CONTENT_TYPE_IDS } from '../../common/constants/place';

export class AddTripPlaceDto {
  @IsString()
  @MinLength(1, { message: '장소 ID를 입력해 주세요.' })
  externalId!: string;

  @IsString()
  @IsIn(TOUR_CONTENT_TYPE_IDS, { message: '관광 타입 ID가 올바르지 않습니다.' })
  contentTypeId!: string;

  @IsString()
  @MinLength(1, { message: '장소 이름을 입력해 주세요.' })
  name!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
