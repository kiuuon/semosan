import { BadRequestException, Injectable } from '@nestjs/common';

import { MailService } from '../mail/mail.service';
import { CreateSupportInquiryDto } from './dto/create-support-inquiry.dto';

@Injectable()
export class SupportService {
  constructor(private readonly mailService: MailService) {}

  async createInquiry(dto: CreateSupportInquiryDto): Promise<{ message: string }> {
    const content = dto.content.trim();
    if (!content) {
      throw new BadRequestException('문의 내용을 입력해 주세요.');
    }

    await this.mailService.sendSupportInquiry({
      content,
      nickname: dto.nickname?.trim() || undefined,
      userEmail: dto.email?.trim().toLowerCase() || undefined,
    });

    return { message: '문의가 접수되었습니다.' };
  }
}
