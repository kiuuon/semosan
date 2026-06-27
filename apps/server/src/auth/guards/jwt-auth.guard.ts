import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { AUTH_ERROR_CODES } from '../../common/constants/error-codes';

function isTokenExpiredError(info: unknown): boolean {
  return (
    typeof info === 'object' &&
    info !== null &&
    'name' in info &&
    (info as { name: string }).name === 'TokenExpiredError'
  );
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(err: unknown, user: TUser, info: unknown): TUser {
    if (isTokenExpiredError(info)) {
      throw new UnauthorizedException({
        message: '액세스 토큰이 만료되었습니다.',
        errorCode: AUTH_ERROR_CODES.ACCESS_TOKEN_EXPIRED,
      });
    }

    if (err || !user) {
      throw err ?? new UnauthorizedException('유효하지 않은 토큰입니다.');
    }

    return user;
  }
}
