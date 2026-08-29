import { Body, Controller, Post } from '@nestjs/common';

import { CreateSupportInquiryDto } from './dto/create-support-inquiry.dto';
import { SupportService } from './support.service';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('inquiries')
  createInquiry(@Body() dto: CreateSupportInquiryDto) {
    return this.supportService.createInquiry(dto);
  }
}
