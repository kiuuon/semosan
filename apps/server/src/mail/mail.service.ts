import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    if (!this.resend) {
      this.logger.warn(`[DEV] Email verification code for ${email}: ${code}`);
      return;
    }

    const from = this.configService.get<string>('RESEND_FROM_EMAIL') ?? 'onboarding@resend.dev';

    const { error } = await this.resend.emails.send({
      from,
      to: email,
      subject: '이메일 인증 코드',
      html: `
        <p>회원가입을 위한 인증 코드입니다.</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>
        <p>코드는 10분간 유효합니다.</p>
      `,
    });

    if (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
    }
  }
}
