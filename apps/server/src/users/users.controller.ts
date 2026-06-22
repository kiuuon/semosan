import { Body, Controller, Get, InternalServerErrorException, Post, UseGuards } from '@nestjs/common';

import { EmailVerificationService } from '../auth/email-verification.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailVerificationType } from '../auth/types/email-verification-type';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    await this.emailVerificationService.validateAndConsumeToken(
      createUserDto.email,
      EmailVerificationType.SIGNUP,
      createUserDto.verificationToken,
    );

    const user = await this.usersService.create(createUserDto);

    if (!user?._id) {
      throw new InternalServerErrorException('회원가입 처리에 실패했습니다.');
    }

    return this.authService.issueTokensAfterSignup(String(user._id));
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.usersService.findAll();
  }
}
