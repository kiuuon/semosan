import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateFeedPostDto {
  @IsString()
  @IsNotEmpty({ message: '내용을 입력해 주세요.' })
  @MaxLength(2000, { message: '글은 2000자 이내로 입력해 주세요.' })
  content!: string;
}
