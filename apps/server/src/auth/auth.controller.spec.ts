import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { UserDocument } from '../schemas/user.schema';
import { UsersService } from '../users/users.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { EmailVerificationType } from './types/email-verification-type';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let emailVerificationService: jest.Mocked<EmailVerificationService>;
  let usersService: jest.Mocked<UsersService>;

  const tokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            refresh: jest.fn(),
            logout: jest.fn(),
            sanitizeUser: jest.fn(),
          },
        },
        {
          provide: EmailVerificationService,
          useValue: {
            sendCode: jest.fn(),
            verifyCode: jest.fn(),
            validateAndConsumeToken: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            resetPassword: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(AuthController);
    authService = module.get(AuthService);
    emailVerificationService = module.get(EmailVerificationService);
    usersService = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sendEmailCode delegates to EmailVerificationService', async () => {
    emailVerificationService.sendCode.mockResolvedValue({ message: '인증 코드를 발송했습니다.' });

    const dto = { email: 'test@example.com', type: EmailVerificationType.SIGNUP };
    const result = await controller.sendEmailCode(dto);

    expect(emailVerificationService.sendCode).toHaveBeenCalledWith(dto.email, dto.type);
    expect(result).toEqual({ message: '인증 코드를 발송했습니다.' });
  });

  it('verifyEmailCode delegates to EmailVerificationService', async () => {
    emailVerificationService.verifyCode.mockResolvedValue({ verificationToken: 'verification-token' });

    const dto = {
      email: 'test@example.com',
      type: EmailVerificationType.SIGNUP,
      code: '123456',
    };
    const result = await controller.verifyEmailCode(dto);

    expect(emailVerificationService.verifyCode).toHaveBeenCalledWith(dto.email, dto.type, dto.code);
    expect(result).toEqual({ verificationToken: 'verification-token' });
  });

  it('resetPassword validates token and resets password', async () => {
    emailVerificationService.validateAndConsumeToken.mockResolvedValue(undefined);
    usersService.resetPassword.mockResolvedValue(undefined);

    const dto = {
      email: 'test@example.com',
      verificationToken: 'verification-token',
      newPassword: 'new-password123',
    };
    const result = await controller.resetPassword(dto);

    expect(emailVerificationService.validateAndConsumeToken).toHaveBeenCalledWith(
      dto.email,
      EmailVerificationType.PASSWORD_RESET,
      dto.verificationToken,
    );
    expect(usersService.resetPassword).toHaveBeenCalledWith(dto.email, dto.newPassword);
    expect(result).toEqual({ message: '비밀번호가 변경되었습니다.' });
  });

  it('login delegates to AuthService', async () => {
    authService.login.mockResolvedValue(tokens);

    const dto = { email: 'test@example.com', password: 'password123' };
    const result = await controller.login(dto);

    expect(authService.login).toHaveBeenCalledWith(dto);
    expect(result).toEqual(tokens);
  });

  it('refresh delegates to AuthService', async () => {
    authService.refresh.mockResolvedValue(tokens);

    const dto = { refreshToken: 'refresh-token' };
    const result = await controller.refresh(dto);

    expect(authService.refresh).toHaveBeenCalledWith(dto.refreshToken);
    expect(result).toEqual(tokens);
  });

  it('logout delegates to AuthService', async () => {
    authService.logout.mockResolvedValue(undefined);

    await controller.logout({ refreshToken: 'refresh-token' });

    expect(authService.logout).toHaveBeenCalledWith('refresh-token');
  });

  it('me returns sanitized user', () => {
    const userId = new Types.ObjectId();
    const user = {
      _id: userId,
      email: 'test@example.com',
      password: 'hashed-password',
      nickname: 'test-user',
      status: 'ACTIVE',
    } as unknown as UserDocument;
    const sanitizedUser = {
      _id: userId,
      email: user.email,
      nickname: user.nickname,
      status: user.status,
    };

    authService.sanitizeUser.mockReturnValue(sanitizedUser);

    const result = controller.me(user);

    expect(authService.sanitizeUser).toHaveBeenCalledWith(user);
    expect(result).toEqual(sanitizedUser);
  });
});
