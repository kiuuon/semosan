import { IsEmail, IsEnum, IsString, Length } from 'class-validator';

import { EMAIL_CODE_LENGTH } from '../../common/constants/email-verification';
import { EmailVerificationType } from '../types/email-verification-type';

export class VerifyEmailCodeDto {
  @IsEmail()
  email: string;

  @IsEnum(EmailVerificationType)
  type: EmailVerificationType;

  @IsString()
  @Length(EMAIL_CODE_LENGTH, EMAIL_CODE_LENGTH)
  code: string;
}
