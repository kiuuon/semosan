import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { Model, Types } from 'mongoose';

import { TRIP_MEMBER_ROLE, TRIP_STATUS } from '../common/constants/trip';
import { Trip, TripDocument } from '../schemas/trip.schema';
import { CreateTripDto } from './dto/create-trip.dto';

const INVITE_CODE_BYTES = 4;
const INVITE_CODE_MAX_RETRY = 5;

@Injectable()
export class TripsService {
  constructor(@InjectModel(Trip.name) private readonly tripModel: Model<TripDocument>) {}

  async create(userId: string, dto: CreateTripDto): Promise<TripDocument> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('유효하지 않은 날짜입니다.');
    }

    if (endDate.getTime() < startDate.getTime()) {
      throw new BadRequestException('종료일은 시작일 이후여야 합니다.');
    }

    const ownerObjectId = new Types.ObjectId(userId);
    const title = dto.title?.trim() || `${dto.mountain.name.trim()} 산행`;
    const inviteCode = await this.generateUniqueInviteCode();

    return this.tripModel.create({
      ownerId: ownerObjectId,
      title,
      mountain: {
        externalId: dto.mountain.externalId.trim(),
        name: dto.mountain.name.trim(),
        region: dto.mountain.region.trim(),
        height: dto.mountain.height,
        imageUrl: dto.mountain.imageUrl,
      },
      startDate,
      endDate,
      status: TRIP_STATUS.PLANNING,
      inviteCode,
      members: [
        {
          userId: ownerObjectId,
          role: TRIP_MEMBER_ROLE.OWNER,
          joinedAt: new Date(),
        },
      ],
      stops: [],
    });
  }

  private async generateUniqueInviteCode(): Promise<string> {
    for (let attempt = 0; attempt < INVITE_CODE_MAX_RETRY; attempt += 1) {
      const code = randomBytes(INVITE_CODE_BYTES).toString('hex').toUpperCase();
      const exists = await this.tripModel.exists({ inviteCode: code }).exec();
      if (!exists) {
        return code;
      }
    }

    throw new BadRequestException('초대코드 생성에 실패했습니다. 다시 시도해 주세요.');
  }

  async findMyTrips(userId: string): Promise<TripDocument[]> {
    return this.tripModel
      .find({
        'members.userId': new Types.ObjectId(userId),
        status: { $ne: TRIP_STATUS.CANCELLED },
      })
      .sort({ startDate: 1 })
      .exec();
  }
}
