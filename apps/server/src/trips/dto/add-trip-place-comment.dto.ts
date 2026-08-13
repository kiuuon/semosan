import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AddTripPlaceCommentDto {
  @IsString()
  @IsNotEmpty({ message: '댓글 내용을 입력해 주세요.' })
  @MaxLength(500, { message: '댓글은 500자 이내로 입력해 주세요.' })
  content!: string;
}
