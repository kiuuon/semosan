import { BadRequestException, ConflictException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { createHash, randomBytes, randomInt } from 'crypto';
import { Model } from 'mongoose';

import {
  EMAIL_CODE_EXPIRES_MS,
  EMAIL_CODE_LENGTH,
  EMAIL_CODE_RESEND_COOLDOWN_MS,
  EMAIL_VERIFICATION_TOKEN_EXPIRES_MS,
} from '../common/constants/email-verification';
import { MailService } from '../mail/mail.service';
import { EmailVerification, EmailVerificationDocument } from '../schemas/email-verification.schema';
import { UsersService } from '../users/users.service';
import { EmailVerificationType } from './types/email-verification-type';

export type VerifyEmailCodeResponse = {
  verificationToken: string;
};

@Injectable()
export class EmailVerificationService {
  constructor(
    @InjectModel(EmailVerification.name)
    private readonly emailVerificationModel: Model<EmailVerificationDocument>,
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
  ) {}

  async sendCode(email: string, type: EmailVerificationType): Promise<{ message: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    const exists = await this.usersService.existsActiveEmail(normalizedEmail);

    if (type === EmailVerificationType.SIGNUP && exists) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    if (type === EmailVerificationType.PASSWORD_RESET && !exists) {
      throw new BadRequestException('가입되지 않은 이메일입니다.');
    }

    const existing = await this.emailVerificationModel.findOne({ email: normalizedEmail, type }).exec();

    if (existing?.lastSentAt) {
      const elapsed = Date.now() - existing.lastSentAt.getTime();

      if (elapsed < EMAIL_CODE_RESEND_COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((EMAIL_CODE_RESEND_COOLDOWN_MS - elapsed) / 1000);
        throw new HttpException(`${remainingSeconds}초 후에 다시 요청할 수 있습니다.`, HttpStatus.TOO_MANY_REQUESTS);
      }
    }

    const code = this.generateCode();
    const now = new Date();

    await this.emailVerificationModel.findOneAndUpdate(
      { email: normalizedEmail, type },
      {
        email: normalizedEmail,
        type,
        codeHash: this.hashValue(code),
        codeExpiresAt: new Date(now.getTime() + EMAIL_CODE_EXPIRES_MS),
        verified: false,
        verificationTokenHash: undefined,
        tokenExpiresAt: undefined,
        lastSentAt: now,
      },
      { upsert: true, new: true },
    );

    await this.mailService.sendVerificationCode(normalizedEmail, code);

    return { message: '인증 코드를 발송했습니다.' };
  }

  async verifyCode(email: string, type: EmailVerificationType, code: string): Promise<VerifyEmailCodeResponse> {
    const normalizedEmail = email.trim().toLowerCase();
    const record = await this.emailVerificationModel.findOne({ email: normalizedEmail, type }).exec();

    if (!record) {
      throw new BadRequestException('인증 코드를 먼저 요청해 주세요.');
    }

    if (record.codeExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('인증 코드가 만료되었습니다. 다시 요청해 주세요.');
    }

    if (record.codeHash !== this.hashValue(code)) {
      throw new BadRequestException('인증 코드가 올바르지 않습니다.');
    }

    const verificationToken = randomBytes(32).toString('hex');

    record.verified = true;
    record.verificationTokenHash = this.hashValue(verificationToken);
    record.tokenExpiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_EXPIRES_MS);
    await record.save();

    return { verificationToken };
  }

  async validateAndConsumeToken(email: string, type: EmailVerificationType, verificationToken: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const record = await this.emailVerificationModel.findOne({ email: normalizedEmail, type }).exec();

    if (!record?.verified || !record.verificationTokenHash || !record.tokenExpiresAt) {
      throw new BadRequestException('이메일 인증이 필요합니다.');
    }

    if (record.tokenExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('이메일 인증이 만료되었습니다. 다시 인증해 주세요.');
    }

    if (record.verificationTokenHash !== this.hashValue(verificationToken)) {
      throw new BadRequestException('유효하지 않은 이메일 인증입니다.');
    }

    await this.emailVerificationModel.deleteOne({ email: normalizedEmail, type }).exec();
  }

  private generateCode(): string {
    const max = 10 ** EMAIL_CODE_LENGTH;
    return String(randomInt(0, max)).padStart(EMAIL_CODE_LENGTH, '0');
  }

  private hashValue(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
