import { Equals, IsBoolean, IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(1)
  verificationToken: string;

  @IsBoolean()
  @Equals(true, { message: '서비스 이용약관에 동의해 주세요.' })
  agreedTerms!: boolean;

  @IsBoolean()
  @Equals(true, { message: '개인정보처리방침에 동의해 주세요.' })
  agreedPrivacy!: boolean;
}
