import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { AuthService } from '../auth/auth.service';
import { EmailVerificationService } from '../auth/email-verification.service';
import { EmailVerificationType } from '../auth/types/email-verification-type';
import { UserDocument } from '../schemas/user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;
  let authService: jest.Mocked<AuthService>;
  let emailVerificationService: jest.Mocked<EmailVerificationService>;

  const userId = new Types.ObjectId();
  const createUserDto = {
    email: 'test@example.com',
    password: 'password123',
    verificationToken: 'verification-token',
    agreedTerms: true,
    agreedPrivacy: true,
  };
  const tokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            issueTokensAfterSignup: jest.fn(),
          },
        },
        {
          provide: EmailVerificationService,
          useValue: {
            validateAndConsumeToken: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(UsersController);
    usersService = module.get(UsersService);
    authService = module.get(AuthService);
    emailVerificationService = module.get(EmailVerificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('validates email token, creates user, and issues signup tokens', async () => {
      const user = { _id: userId } as unknown as UserDocument;

      emailVerificationService.validateAndConsumeToken.mockResolvedValue(undefined);
      (usersService.create as jest.Mock).mockResolvedValue(user);
      authService.issueTokensAfterSignup.mockResolvedValue(tokens);

      const result = await controller.create(createUserDto);

      expect(emailVerificationService.validateAndConsumeToken).toHaveBeenCalledWith(
        createUserDto.email,
        EmailVerificationType.SIGNUP,
        createUserDto.verificationToken,
      );
      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
      expect(authService.issueTokensAfterSignup).toHaveBeenCalledWith(userId.toString());
      expect(result).toEqual(tokens);
    });

    it('throws InternalServerErrorException when created user has no id', async () => {
      emailVerificationService.validateAndConsumeToken.mockResolvedValue(undefined);
      (usersService.create as jest.Mock).mockResolvedValue({} as UserDocument);

      await expect(controller.create(createUserDto)).rejects.toThrow(
        new InternalServerErrorException('회원가입 처리에 실패했습니다.'),
      );

      expect(authService.issueTokensAfterSignup).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('delegates to UsersService', async () => {
      const users = [{ _id: userId, email: 'test@example.com' }];
      usersService.findAll.mockResolvedValue(users as never);

      const result = await controller.findAll();

      expect(usersService.findAll).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });
});
