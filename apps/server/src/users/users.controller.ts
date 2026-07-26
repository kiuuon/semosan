import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { EmailVerificationService } from '../auth/email-verification.service';
import { AuthService } from '../auth/auth.service';
import type { AuthenticatedRequest } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailVerificationType } from '../auth/types/email-verification-type';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateNicknameDto } from './dto/update-nickname.dto';
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

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMe(@Req() req: AuthenticatedRequest, @Body() dto: UpdateNicknameDto) {
    return this.usersService.updateNickname(req.user._id.toString(), dto.nickname);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMe(@Req() req: AuthenticatedRequest) {
    const userId = req.user._id.toString();
    await this.usersService.deleteAccount(userId);
    await this.authService.revokeAllRefreshTokens(userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.usersService.findAll();
  }
}
