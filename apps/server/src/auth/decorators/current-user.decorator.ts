import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { UserDocument } from '../../schemas/user.schema';

export type AuthenticatedRequest = Request & { user: UserDocument };

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): UserDocument => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  return request.user;
});
