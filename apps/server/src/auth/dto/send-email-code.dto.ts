import { IsEmail, IsEnum } from 'class-validator';

import { EmailVerificationType } from '../types/email-verification-type';

export class SendEmailCodeDto {
  @IsEmail({}, { message: '올바른 이메일 형식을 입력해 주세요.' })
  email: string;

  @IsEnum(EmailVerificationType)
  type: EmailVerificationType;
}
