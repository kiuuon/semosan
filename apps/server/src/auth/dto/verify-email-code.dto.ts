import { IsEmail, IsString, Length } from 'class-validator';

import { EMAIL_CODE_LENGTH } from '../../lib/constants/email-verification';

export class VerifyEmailCodeDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(EMAIL_CODE_LENGTH, EMAIL_CODE_LENGTH)
  code: string;
}
