import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { getRandomNickname } from '@woowa-babble/random-nickname';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';

import { USER_STATUS } from '../common/constants/status';
import { User, UserDocument } from '../schemas/user.schema';
import { UsersService } from './users.service';

jest.mock('bcrypt');
jest.mock('@woowa-babble/random-nickname');

describe('UsersService', () => {
  let service: UsersService;
  let userModel: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    updateOne: jest.Mock;
  };

  const userId = new Types.ObjectId();
  const user = {
    _id: userId,
    email: 'test@example.com',
    password: 'hashed-password',
    nickname: 'fox-a1b2',
    status: USER_STATUS.ACTIVE,
  } as unknown as UserDocument;

  beforeEach(async () => {
    userModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      updateOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: userModel,
        },
      ],
    }).compile();

    service = module.get(UsersService);
    (getRandomNickname as jest.Mock).mockReturnValue('fox');
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns active users without password field', async () => {
      const exec = jest.fn().mockResolvedValue([user]);
      const select = jest.fn().mockReturnValue({ exec });
      userModel.find.mockReturnValue({ select });

      const result = await service.findAll();

      expect(userModel.find).toHaveBeenCalledWith({ status: USER_STATUS.ACTIVE });
      expect(select).toHaveBeenCalledWith('-password');
      expect(result).toEqual([user]);
    });
  });

  describe('findActiveById', () => {
    it('returns null when id is invalid', async () => {
      const result = await service.findActiveById('invalid-id');

      expect(result).toBeNull();
      expect(userModel.findOne).not.toHaveBeenCalled();
    });

    it('returns active user when id is valid', async () => {
      const exec = jest.fn().mockResolvedValue(user);
      userModel.findOne.mockReturnValue({ exec });

      const result = await service.findActiveById(userId.toString());

      expect(userModel.findOne).toHaveBeenCalledWith({
        _id: userId.toString(),
        status: USER_STATUS.ACTIVE,
      });
      expect(result).toEqual(user);
    });
  });

  describe('findActiveByEmailWithPassword', () => {
    it('returns user by email', async () => {
      const exec = jest.fn().mockResolvedValue(user);
      userModel.findOne.mockReturnValue({ exec });

      const result = await service.findActiveByEmailWithPassword('test@example.com');

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
        status: USER_STATUS.ACTIVE,
      });
      expect(result).toEqual(user);
    });
  });

  describe('existsActiveEmail', () => {
    it('returns true when active user exists', async () => {
      const exec = jest.fn().mockResolvedValue({ _id: userId });
      const select = jest.fn().mockReturnValue({ exec });
      userModel.findOne.mockReturnValue({ select });

      const result = await service.existsActiveEmail('  Test@Example.com ');

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
        status: USER_STATUS.ACTIVE,
      });
      expect(select).toHaveBeenCalledWith('_id');
      expect(result).toBe(true);
    });

    it('returns false when active user does not exist', async () => {
      const exec = jest.fn().mockResolvedValue(null);
      const select = jest.fn().mockReturnValue({ exec });
      userModel.findOne.mockReturnValue({ select });

      const result = await service.existsActiveEmail('missing@example.com');

      expect(result).toBe(false);
    });
  });

  describe('create', () => {
    it('creates user with normalized email and hashed password', async () => {
      userModel.create.mockResolvedValue(user);

      const result = await service.create({
        email: '  Test@Example.com ',
        password: 'password123',
        verificationToken: 'verification-token',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(getRandomNickname).toHaveBeenCalledWith('animals');
      expect(userModel.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'hashed-password',
        nickname: expect.stringMatching(/^fox-[0-9a-f]{4}$/),
        status: USER_STATUS.ACTIVE,
      });
      expect(result).toEqual(user);
    });

    it('throws InternalServerErrorException when nickname generation fails', async () => {
      (getRandomNickname as jest.Mock).mockReturnValue(null);

      await expect(
        service.create({
          email: 'test@example.com',
          password: 'password123',
          verificationToken: 'verification-token',
        }),
      ).rejects.toThrow(new InternalServerErrorException('서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'));

      expect(userModel.create).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('updates password for active user', async () => {
      const exec = jest.fn().mockResolvedValue({ matchedCount: 1 });
      userModel.updateOne.mockReturnValue({ exec });

      await service.resetPassword('  Test@Example.com ', 'new-password123');

      expect(bcrypt.hash).toHaveBeenCalledWith('new-password123', 10);
      expect(userModel.updateOne).toHaveBeenCalledWith(
        { email: 'test@example.com', status: USER_STATUS.ACTIVE },
        { $set: { password: 'hashed-password' } },
      );
    });

    it('throws BadRequestException when user is not found', async () => {
      const exec = jest.fn().mockResolvedValue({ matchedCount: 0 });
      userModel.updateOne.mockReturnValue({ exec });

      await expect(service.resetPassword('missing@example.com', 'new-password123')).rejects.toThrow(
        new BadRequestException('가입되지 않은 이메일입니다.'),
      );
    });
  });
});
