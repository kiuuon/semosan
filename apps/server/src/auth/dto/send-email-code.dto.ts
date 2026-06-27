import { IsEmail, IsEnum } from 'class-validator';

import { EmailVerificationType } from '../types/email-verification-type';

export class SendEmailCodeDto {
  @IsEmail()
  email: string;

  @IsEnum(EmailVerificationType)
  type: EmailVerificationType;
}
