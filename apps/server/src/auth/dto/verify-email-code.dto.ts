import { IsEmail, IsEnum, IsString, Length } from 'class-validator';

import { EMAIL_CODE_LENGTH } from '../../common/constants/email-verification';
import { EmailVerificationType } from '../types/email-verification-type';

export class VerifyEmailCodeDto {
  @IsEmail({}, { message: '올바른 이메일 형식을 입력해 주세요.' })
  email: string;

  @IsEnum(EmailVerificationType)
  type: EmailVerificationType;

  @IsString()
  @Length(EMAIL_CODE_LENGTH, EMAIL_CODE_LENGTH)
  code: string;
}
