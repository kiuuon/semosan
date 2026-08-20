import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model, Types } from 'mongoose';
import { randomInt } from 'crypto';
import { getRandomNickname } from '@woowa-babble/random-nickname';
import { USER_STATUS } from '../common/constants/status';
import { User, UserDocument } from '../schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

const BCRYPT_ROUNDS = 10;
const NICKNAME_SUFFIX_LENGTH = 4;

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  findAll() {
    return this.userModel.find({ status: USER_STATUS.ACTIVE }).select('-password').exec();
  }

  findActiveById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    return this.userModel.findOne({ _id: id, status: USER_STATUS.ACTIVE }).exec();
  }

  findActiveByEmailWithPassword(email: string) {
    return this.userModel.findOne({ email, status: USER_STATUS.ACTIVE }).exec();
  }

  async existsActiveEmail(email: string): Promise<boolean> {
    const user = await this.userModel
      .findOne({ email: email.trim().toLowerCase(), status: USER_STATUS.ACTIVE })
      .select('_id')
      .exec();

    return !!user;
  }

  async create(createUserDto: CreateUserDto) {
    const email = createUserDto.email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(createUserDto.password, BCRYPT_ROUNDS);

    const base = getRandomNickname('animals');
    // 라이브러리 미작동에 대한 특수 케이스
    if (!base) {
      throw new InternalServerErrorException('서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    }

    const max = 10 ** NICKNAME_SUFFIX_LENGTH;
    const suffix = String(randomInt(0, max)).padStart(NICKNAME_SUFFIX_LENGTH, '0');
    const nickname = `${base.replace(/\s+/g, '')}${suffix}`;

    const agreedAt = new Date();
    const user = await this.userModel.create({
      email,
      password: hashedPassword,
      nickname,
      status: USER_STATUS.ACTIVE,
      termsAgreedAt: agreedAt,
      privacyAgreedAt: agreedAt,
    });

    return user;
  }

  async updateNickname(userId: string, nickname: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const user = await this.userModel
      .findOneAndUpdate(
        { _id: userId, status: USER_STATUS.ACTIVE },
        { $set: { nickname: nickname.trim() } },
        { new: true },
      )
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return user;
  }

  async updatePasswordById(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    const result = await this.userModel
      .updateOne({ _id: userId, status: USER_STATUS.ACTIVE }, { $set: { password: hashedPassword } })
      .exec();

    if (!result.matchedCount) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
  }

  async deleteAccount(userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const result = await this.userModel
      .updateOne({ _id: userId, status: USER_STATUS.ACTIVE }, { $set: { status: USER_STATUS.DELETED } })
      .exec();

    if (!result.matchedCount) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
  }

  async resetPassword(email: string, newPassword: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    const result = await this.userModel
      .updateOne(
        { email: normalizedEmail, status: USER_STATUS.ACTIVE },
        {
          $set: { password: hashedPassword },
        },
      )
      .exec();

    if (!result.matchedCount) {
      throw new BadRequestException('가입되지 않은 이메일입니다.');
    }
  }
}
