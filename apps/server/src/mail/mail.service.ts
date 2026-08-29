import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
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

  async sendSupportInquiry(params: { content: string; nickname?: string; userEmail?: string }): Promise<void> {
    const to = this.configService.get<string>('SUPPORT_EMAIL') ?? 'kiuuon29@gmail.com';
    const nickname = params.nickname ?? '비로그인';
    const userEmail = params.userEmail ?? '-';

    if (!this.resend) {
      this.logger.warn(
        `[DEV] Support inquiry to ${to}\n닉네임: ${nickname}\n이메일: ${userEmail}\n내용:\n${params.content}`,
      );
      return;
    }

    const from = this.configService.get<string>('RESEND_FROM_EMAIL') ?? 'onboarding@resend.dev';
    const escapeHtml = (value: string) =>
      value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br />');
    const escapedContent = escapeHtml(params.content);
    const escapedNickname = escapeHtml(nickname);
    const escapedUserEmail = escapeHtml(userEmail);

    const { error } = await this.resend.emails.send({
      from,
      to,
      subject: '[세모산] 문의',
      html: `
        <p><strong>닉네임:</strong> ${escapedNickname}</p>
        <p><strong>이메일:</strong> ${escapedUserEmail}</p>
        <hr />
        <p>${escapedContent}</p>
      `,
    });

    if (error) {
      this.logger.error(`Failed to send support inquiry email to ${to}`, error);
      throw new InternalServerErrorException('문의 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    }
  }
}
