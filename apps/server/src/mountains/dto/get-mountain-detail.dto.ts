import { IsNotEmpty, IsString } from 'class-validator';

export class GetMountainDetailDto {
  @IsString()
  @IsNotEmpty({ message: '산 이름을 입력해 주세요.' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: '소재지를 입력해 주세요.' })
  region!: string;
}
