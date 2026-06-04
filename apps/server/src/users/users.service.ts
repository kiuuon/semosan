import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { randomBytes } from 'crypto';
import { getRandomNickname } from '@woowa-babble/random-nickname';
import { USER_STATUS } from '../lib/constants/status';
import { User, UserDocument } from '../schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

const BCRYPT_ROUNDS = 10;
const NICKNAME_COLLISION_MAX_ATTEMPTS = 5;

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  findAll() {
    return this.userModel.find({ status: USER_STATUS.ACTIVE }).select('-password').exec();
  }

  async create(createUserDto: CreateUserDto) {
    const email = createUserDto.email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(createUserDto.password, BCRYPT_ROUNDS);

    for (let attempt = 0; attempt < NICKNAME_COLLISION_MAX_ATTEMPTS; attempt++) {
      const base = getRandomNickname('animals');
      if (!base) {
        throw new Error('Failed to generate nickname base');
      }
      const suffix = randomBytes(2).toString('hex');
      const nickname = `${base}-${suffix}`;

      try {
        const user = await this.userModel.create({
          email,
          password: hashedPassword,
          nickname,
          status: USER_STATUS.ACTIVE,
        });

        return this.userModel.findById(user._id).select('-password').lean().exec();
      } catch (error) {
        if (!this.isDuplicateKeyError(error)) {
          throw error;
        }

        const field = Object.keys(error.keyPattern ?? {})[0];

        if (field === 'email') {
          throw new ConflictException('이미 사용 중인 이메일입니다.');
        }

        if (field === 'nickname' && attempt < NICKNAME_COLLISION_MAX_ATTEMPTS - 1) {
          continue;
        }

        if (field === 'nickname') {
          throw new InternalServerErrorException('닉네임을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.');
        }

        throw new ConflictException('이미 등록된 정보입니다.');
      }
    }
  }

  private isDuplicateKeyError(error: unknown): error is { code: number; keyPattern?: Record<string, number> } {
    return typeof error === 'object' && error !== null && 'code' in error && (error as { code: number }).code === 11000;
  }
}
