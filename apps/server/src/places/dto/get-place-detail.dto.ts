import { IsIn, IsNotEmpty, IsString } from 'class-validator';

import { TOUR_CONTENT_TYPE_IDS } from '../../common/constants/place';

export class GetPlaceDetailDto {
  @IsString()
  @IsNotEmpty({ message: '관광 타입 ID를 입력해 주세요.' })
  @IsIn(TOUR_CONTENT_TYPE_IDS, { message: '관광 타입 ID가 올바르지 않습니다.' })
  contentTypeId!: string;
}
