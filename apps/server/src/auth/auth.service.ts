import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { Model, Types } from 'mongoose';

import { ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_BYTES, REFRESH_TOKEN_EXPIRES_MS } from '../common/constants/auth';
import { AUTH_ERROR_CODES } from '../common/constants/error-codes';
import { RefreshToken, RefreshTokenDocument } from '../schemas/refresh-token.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './types/jwt-payload';

export type AuthTokensResponse = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  async issueTokensAfterSignup(userId: string): Promise<AuthTokensResponse> {
    const user = await this.usersService.findActiveById(userId);

    if (!user) {
      throw new InternalServerErrorException('회원가입 후 로그인 처리에 실패했습니다.');
    }

    return this.issueTokens(user);
  }

  async login(loginDto: LoginDto): Promise<AuthTokensResponse> {
    const email = loginDto.email.trim().toLowerCase();
    const user = await this.usersService.findActiveByEmailWithPassword(email);

    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const passwordMatches = await bcrypt.compare(loginDto.password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    return this.issueTokens(user);
  }

  async verifyPassword(userId: string, password: string): Promise<{ verified: true }> {
    const user = await this.usersService.findActiveById(userId);

    if (!user) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('비밀번호가 올바르지 않습니다.');
    }

    return { verified: true };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ changed: true }> {
    const user = await this.usersService.findActiveById(userId);

    if (!user) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다.');
    }

    await this.usersService.updatePasswordById(userId, newPassword);

    return { changed: true };
  }

  async refresh(refreshToken: string): Promise<AuthTokensResponse> {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const stored = await this.refreshTokenModel
      .findOne({
        tokenHash,
        revokedAt: { $exists: false },
        expiresAt: { $gt: new Date() },
      })
      .exec();

    if (!stored) {
      throw new UnauthorizedException({
        message: '유효하지 않거나 만료된 요청입니다. 다시 로그인해 주세요.',
        errorCode: AUTH_ERROR_CODES.REFRESH_TOKEN_EXPIRED,
      });
    }

    const user = await this.usersService.findActiveById(stored.userId.toString());

    if (!user) {
      await this.revokeRefreshToken(stored);
      throw new UnauthorizedException({
        message: '유효하지 않거나 만료된 요청입니다. 다시 로그인해 주세요.',
        errorCode: AUTH_ERROR_CODES.REFRESH_TOKEN_EXPIRED,
      });
    }

    await this.revokeRefreshToken(stored);

    return this.issueTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const stored = await this.refreshTokenModel.findOne({ tokenHash }).exec();

    if (stored && !stored.revokedAt) {
      await this.revokeRefreshToken(stored);
    }
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.refreshTokenModel
      .updateMany(
        { userId: new Types.ObjectId(userId), revokedAt: { $exists: false } },
        { $set: { revokedAt: new Date() } },
      )
      .exec();
  }

  private async issueTokens(user: UserDocument): Promise<AuthTokensResponse> {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });

    const refreshToken = randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS);

    await this.refreshTokenModel.create({
      userId: new Types.ObjectId(user._id),
      tokenHash: this.hashRefreshToken(refreshToken),
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private async revokeRefreshToken(token: RefreshTokenDocument): Promise<void> {
    token.revokedAt = new Date();
    await token.save();
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  sanitizeUser(user: UserDocument | User): Record<string, unknown> {
    const doc = typeof (user as UserDocument).toObject === 'function' ? (user as UserDocument).toObject() : user;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...rest } = doc as UserDocument & { password?: string };
    return rest as Record<string, unknown>;
  }
}
