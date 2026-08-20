import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class GetConcentrationRateDto {
  @IsString()
  @IsNotEmpty({ message: '장소명을 입력해 주세요.' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: '지역 코드를 입력해 주세요.' })
  areaCd!: string;

  @IsString()
  @IsNotEmpty({ message: '시군구 코드를 입력해 주세요.' })
  signguCd!: string;

  @IsDateString({}, { message: '여행 시작일을 확인해 주세요.' })
  startDate!: string;

  @IsDateString({}, { message: '여행 종료일을 확인해 주세요.' })
  endDate!: string;
}
