import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model, Types } from 'mongoose';
import { randomBytes } from 'crypto';
import { getRandomNickname } from '@woowa-babble/random-nickname';
import { USER_STATUS } from '../common/constants/status';
import { User, UserDocument } from '../schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

const BCRYPT_ROUNDS = 10;

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

    const suffix = randomBytes(2).toString('hex');
    const nickname = `${base}-${suffix}`;

    const user = await this.userModel.create({
      email,
      password: hashedPassword,
      nickname,
      status: USER_STATUS.ACTIVE,
    });

    return user;
  }
}
