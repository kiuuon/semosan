import { InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { Types } from 'mongoose';

import { AUTH_ERROR_CODES } from '../common/constants/error-codes';
import { RefreshToken, RefreshTokenDocument } from '../schemas/refresh-token.schema';
import { UserDocument } from '../schemas/user.schema';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let refreshTokenModel: {
    findOne: jest.Mock;
    create: jest.Mock;
  };

  const userId = new Types.ObjectId();
  const user = {
    _id: userId,
    email: 'test@example.com',
    password: 'hashed-password',
    toObject: jest.fn().mockReturnValue({
      _id: userId,
      email: 'test@example.com',
      password: 'hashed-password',
      nickname: 'test-user',
    }),
  } as unknown as UserDocument;

  function mockActiveUser(value: UserDocument | null) {
    (usersService.findActiveByEmailWithPassword as jest.Mock).mockResolvedValue(value);
    (usersService.findActiveById as jest.Mock).mockResolvedValue(value);
  }

  beforeEach(async () => {
    refreshTokenModel = {
      findOne: jest.fn(),
      create: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findActiveById: jest.fn(),
            findActiveByEmailWithPassword: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('access-token'),
          },
        },
        {
          provide: getModelToken(RefreshToken.name),
          useValue: refreshTokenModel,
        },
      ],
    }).compile();

    service = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('returns tokens when email and password are valid', async () => {
      mockActiveUser(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: '  Test@Example.com ',
        password: 'password123',
      });

      expect(usersService.findActiveByEmailWithPassword).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: userId.toString(), email: 'test@example.com' },
        expect.objectContaining({ expiresIn: expect.any(String) }),
      );
      expect(refreshTokenModel.create).toHaveBeenCalled();
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: expect.any(String),
      });
    });

    it('throws UnauthorizedException when user is not found', async () => {
      usersService.findActiveByEmailWithPassword.mockResolvedValue(null);

      await expect(service.login({ email: 'missing@example.com', password: 'password123' })).rejects.toThrow(
        new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.'),
      );
    });

    it('throws UnauthorizedException when password does not match', async () => {
      mockActiveUser(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login({ email: 'test@example.com', password: 'wrong-password' })).rejects.toThrow(
        new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.'),
      );
    });
  });

  describe('issueTokensAfterSignup', () => {
    it('returns tokens when user exists', async () => {
      mockActiveUser(user);

      const result = await service.issueTokensAfterSignup(userId.toString());

      expect(usersService.findActiveById).toHaveBeenCalledWith(userId.toString());
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toEqual(expect.any(String));
    });

    it('throws InternalServerErrorException when user is missing', async () => {
      usersService.findActiveById.mockResolvedValue(null);

      await expect(service.issueTokensAfterSignup(userId.toString())).rejects.toThrow(
        new InternalServerErrorException('회원가입 후 로그인 처리에 실패했습니다.'),
      );
    });
  });

  describe('refresh', () => {
    it('revokes the old refresh token and returns new tokens', async () => {
      const refreshToken = 'valid-refresh-token';
      const storedToken: Pick<RefreshTokenDocument, 'userId' | 'tokenHash' | 'expiresAt' | 'save'> & {
        revokedAt?: Date;
      } = {
        userId,
        tokenHash: createHash('sha256').update(refreshToken).digest('hex'),
        expiresAt: new Date(Date.now() + 60_000),
        save: jest.fn().mockResolvedValue(undefined),
      };

      refreshTokenModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(storedToken),
      });
      mockActiveUser(user);

      const result = await service.refresh(refreshToken);

      expect(refreshTokenModel.findOne).toHaveBeenCalledWith({
        tokenHash: storedToken.tokenHash,
        revokedAt: { $exists: false },
        expiresAt: { $gt: expect.any(Date) },
      });
      expect(storedToken.save).toHaveBeenCalled();
      expect(storedToken.revokedAt).toBeInstanceOf(Date);
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: expect.any(String),
      });
    });

    it('throws REFRESH_TOKEN_EXPIRED when refresh token is not found', async () => {
      refreshTokenModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.refresh('missing-token')).rejects.toMatchObject({
        response: {
          message: '유효하지 않거나 만료된 요청입니다. 다시 로그인해 주세요.',
          errorCode: AUTH_ERROR_CODES.REFRESH_TOKEN_EXPIRED,
        },
      });
    });

    it('revokes token and throws REFRESH_TOKEN_EXPIRED when user is inactive', async () => {
      const refreshToken = 'valid-refresh-token';
      const storedToken: Pick<RefreshTokenDocument, 'userId' | 'tokenHash' | 'expiresAt' | 'save'> & {
        revokedAt?: Date;
      } = {
        userId,
        tokenHash: createHash('sha256').update(refreshToken).digest('hex'),
        expiresAt: new Date(Date.now() + 60_000),
        save: jest.fn().mockResolvedValue(undefined),
      };

      refreshTokenModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(storedToken),
      });
      mockActiveUser(null);

      await expect(service.refresh(refreshToken)).rejects.toMatchObject({
        response: {
          errorCode: AUTH_ERROR_CODES.REFRESH_TOKEN_EXPIRED,
        },
      });
      expect(storedToken.save).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('revokes refresh token when it exists and is active', async () => {
      const refreshToken = 'active-refresh-token';
      const storedToken: { revokedAt?: Date; save: jest.Mock } = {
        revokedAt: undefined,
        save: jest.fn().mockResolvedValue(undefined),
      };

      refreshTokenModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(storedToken),
      });

      await service.logout(refreshToken);

      expect(refreshTokenModel.findOne).toHaveBeenCalledWith({
        tokenHash: createHash('sha256').update(refreshToken).digest('hex'),
      });
      expect(storedToken.save).toHaveBeenCalled();
      expect(storedToken.revokedAt).toBeInstanceOf(Date);
    });

    it('does nothing when refresh token is not found', async () => {
      refreshTokenModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.logout('missing-token')).resolves.toBeUndefined();
    });

    it('does nothing when refresh token is already revoked', async () => {
      const storedToken = {
        revokedAt: new Date(),
        save: jest.fn(),
      };

      refreshTokenModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(storedToken),
      });

      await service.logout('revoked-token');

      expect(storedToken.save).not.toHaveBeenCalled();
    });
  });

  describe('sanitizeUser', () => {
    it('removes password from user document', () => {
      const sanitized = service.sanitizeUser(user);

      expect(sanitized).toEqual({
        _id: userId,
        email: 'test@example.com',
        nickname: 'test-user',
      });
      expect(sanitized).not.toHaveProperty('password');
    });
  });
});
