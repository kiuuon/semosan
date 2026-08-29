import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSupportInquiryDto {
  @IsString()
  @IsNotEmpty({ message: '문의 내용을 입력해 주세요.' })
  @MaxLength(2000, { message: '문의는 2000자 이내로 입력해 주세요.' })
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
