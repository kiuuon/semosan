import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from './decorators/current-user.decorator';
import { EmailVerificationService } from './email-verification.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SendEmailCodeDto } from './dto/send-email-code.dto';
import { VerifyEmailCodeDto } from './dto/verify-email-code.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from '../schemas/user.schema';
import { AuthService } from './auth.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UsersService } from '../users/users.service';
import { EmailVerificationType } from './types/email-verification-type';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly usersService: UsersService,
  ) {}

  @Post('email/send-code')
  sendEmailCode(@Body() dto: SendEmailCodeDto) {
    return this.emailVerificationService.sendCode(dto.email, dto.type);
  }

  @Post('email/verify-code')
  verifyEmailCode(@Body() dto: VerifyEmailCodeDto) {
    return this.emailVerificationService.verifyCode(dto.email, dto.type, dto.code);
  }

  @Post('password/reset')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.emailVerificationService.validateAndConsumeToken(
      dto.email,
      EmailVerificationType.PASSWORD_RESET,
      dto.verificationToken,
    );
    await this.usersService.resetPassword(dto.email, dto.newPassword);
    return { message: '비밀번호가 변경되었습니다.' };
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: RefreshTokenDto) {
    await this.authService.logout(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    return this.authService.sanitizeUser(user);
  }
}
