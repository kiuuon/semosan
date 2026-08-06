import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { Model, Types } from 'mongoose';

import { PLACE_COMMENT_STATUS, TRIP_PLACE_STATUS } from '../common/constants/place';
import { TRIP_MEMBER_ROLE, TRIP_STATUS } from '../common/constants/trip';
import { TripPlace, TripPlaceDocument } from '../schemas/trip-place.schema';
import { Trip, TripDocument } from '../schemas/trip.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { AddTripPlaceDto } from './dto/add-trip-place.dto';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';

const INVITE_CODE_BYTES = 4;
const INVITE_CODE_MAX_RETRY = 5;

export type TripMemberWithNickname = {
  userId: string;
  role: string;
  joinedAt: Date;
  nickname: string;
};

export type TripPlaceResponse = {
  _id: string;
  tripId: string;
  externalId: string;
  contentTypeId: string;
  name: string;
  address?: string;
  imageUrl?: string;
  createdBy: string;
  likedUserIds: string[];
  commentCount: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type TripDetailResponse = {
  _id: string;
  ownerId: string;
  title?: string;
  mountain: Trip['mountain'];
  startDate: Date;
  endDate: Date;
  status: string;
  inviteCode: string;
  members: TripMemberWithNickname[];
  createdAt?: Date;
  updatedAt?: Date;
};

@Injectable()
export class TripsService {
  constructor(
    @InjectModel(Trip.name) private readonly tripModel: Model<TripDocument>,
    @InjectModel(TripPlace.name) private readonly tripPlaceModel: Model<TripPlaceDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

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
    });
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

  async findOneForMember(tripId: string, userId: string): Promise<TripDetailResponse> {
    const trip = await this.getActiveTripOrThrow(tripId);
    this.assertMember(trip, userId);
    return this.toDetailResponse(trip);
  }

  async update(tripId: string, userId: string, dto: UpdateTripDto): Promise<TripDetailResponse> {
    const trip = await this.getActiveTripOrThrow(tripId);
    this.assertOwner(trip, userId);

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('유효하지 않은 날짜입니다.');
    }

    if (endDate.getTime() < startDate.getTime()) {
      throw new BadRequestException('종료일은 시작일 이후여야 합니다.');
    }

    trip.title = dto.title.trim();
    trip.startDate = startDate;
    trip.endDate = endDate;
    await trip.save();

    return this.toDetailResponse(trip);
  }

  async remove(tripId: string, userId: string): Promise<void> {
    const trip = await this.getActiveTripOrThrow(tripId);
    this.assertOwner(trip, userId);

    trip.status = TRIP_STATUS.CANCELLED;
    await trip.save();
  }

  async findPlaces(tripId: string, userId: string): Promise<TripPlaceResponse[]> {
    const trip = await this.getActiveTripOrThrow(tripId);
    this.assertMember(trip, userId);

    const places = await this.tripPlaceModel
      .find({ tripId: trip._id, status: TRIP_PLACE_STATUS.ACTIVE })
      .sort({ createdAt: -1 })
      .exec();
    return places.map((place) => this.toPlaceResponse(place));
  }

  async addPlace(tripId: string, userId: string, dto: AddTripPlaceDto): Promise<TripPlaceResponse> {
    const trip = await this.getActiveTripOrThrow(tripId);
    this.assertMember(trip, userId);

    const externalId = dto.externalId.trim();
    const contentTypeId = dto.contentTypeId.trim();
    const name = dto.name.trim();
    const address = dto.address?.trim() || undefined;
    const imageUrl = dto.imageUrl?.trim() || undefined;

    const existing = await this.tripPlaceModel.findOne({ tripId: trip._id, externalId }).exec();
    if (existing) {
      if (existing.status === TRIP_PLACE_STATUS.ACTIVE) {
        throw new ConflictException('이미 일정에 추가된 장소입니다.');
      }

      existing.status = TRIP_PLACE_STATUS.ACTIVE;
      existing.contentTypeId = contentTypeId;
      existing.name = name;
      existing.address = address;
      existing.imageUrl = imageUrl;
      await existing.save();

      return this.toPlaceResponse(existing);
    }

    try {
      const place = await this.tripPlaceModel.create({
        tripId: trip._id,
        externalId,
        contentTypeId,
        name,
        address,
        imageUrl,
        createdBy: new Types.ObjectId(userId),
        likedUserIds: [],
        comments: [],
        status: TRIP_PLACE_STATUS.ACTIVE,
      });

      return this.toPlaceResponse(place);
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('이미 일정에 추가된 장소입니다.');
      }
      throw error;
    }
  }

  async removePlace(tripId: string, placeId: string, userId: string): Promise<void> {
    const trip = await this.getActiveTripOrThrow(tripId);
    this.assertMember(trip, userId);

    if (!Types.ObjectId.isValid(placeId)) {
      throw new NotFoundException('추가된 장소를 찾을 수 없습니다.');
    }

    const place = await this.tripPlaceModel
      .findOne({ _id: placeId, tripId: trip._id, status: TRIP_PLACE_STATUS.ACTIVE })
      .exec();
    if (!place) {
      throw new NotFoundException('추가된 장소를 찾을 수 없습니다.');
    }

    place.status = TRIP_PLACE_STATUS.DELETED;
    await place.save();
  }

  async joinByInviteCode(userId: string, inviteCode: string): Promise<TripDetailResponse> {
    const normalizedCode = inviteCode.trim().toUpperCase();
    if (!normalizedCode) {
      throw new BadRequestException('초대코드를 입력해주세요.');
    }

    const trip = await this.tripModel
      .findOne({ inviteCode: normalizedCode, status: { $ne: TRIP_STATUS.CANCELLED } })
      .exec();

    if (!trip) {
      throw new NotFoundException('유효하지 않은 초대코드입니다.');
    }

    const isMember = trip.members.some((member) => member.userId.toString() === userId);
    if (!isMember) {
      trip.members.push({
        userId: new Types.ObjectId(userId),
        role: TRIP_MEMBER_ROLE.MEMBER,
        joinedAt: new Date(),
      });
      await trip.save();
    }

    return this.toDetailResponse(trip);
  }

  private async getActiveTripOrThrow(tripId: string): Promise<TripDocument> {
    if (!Types.ObjectId.isValid(tripId)) {
      throw new NotFoundException('일정을 찾을 수 없습니다.');
    }

    const trip = await this.tripModel.findOne({ _id: tripId, status: { $ne: TRIP_STATUS.CANCELLED } }).exec();

    if (!trip) {
      throw new NotFoundException('일정을 찾을 수 없습니다.');
    }

    return trip;
  }

  private assertMember(trip: TripDocument, userId: string): void {
    const isMember = trip.members.some((member) => member.userId.toString() === userId);
    if (!isMember) {
      throw new ForbiddenException('이 일정에 접근할 권한이 없습니다.');
    }
  }

  private assertOwner(trip: TripDocument, userId: string): void {
    if (trip.ownerId.toString() !== userId) {
      throw new ForbiddenException('일정 소유자만 할 수 있는 작업입니다.');
    }
  }

  private async toDetailResponse(trip: TripDocument): Promise<TripDetailResponse> {
    const memberIds = trip.members.map((member) => member.userId);
    const users = await this.userModel
      .find({ _id: { $in: memberIds } })
      .select('_id nickname')
      .exec();
    const nicknameById = new Map(users.map((user) => [user._id.toString(), user.nickname]));

    return {
      _id: trip._id.toString(),
      ownerId: trip.ownerId.toString(),
      title: trip.title,
      mountain: trip.mountain,
      startDate: trip.startDate,
      endDate: trip.endDate,
      status: trip.status,
      inviteCode: trip.inviteCode,
      members: trip.members.map((member) => ({
        userId: member.userId.toString(),
        role: member.role,
        joinedAt: member.joinedAt,
        nickname: nicknameById.get(member.userId.toString()) ?? '알 수 없음',
      })),
      createdAt: trip.get('createdAt'),
      updatedAt: trip.get('updatedAt'),
    };
  }

  private toPlaceResponse(place: TripPlaceDocument): TripPlaceResponse {
    return {
      _id: place._id.toString(),
      tripId: place.tripId.toString(),
      externalId: place.externalId,
      contentTypeId: place.contentTypeId,
      name: place.name,
      address: place.address,
      imageUrl: place.imageUrl,
      createdBy: place.createdBy.toString(),
      likedUserIds: place.likedUserIds.map((id) => id.toString()),
      commentCount: place.comments.filter((comment) => comment.status === PLACE_COMMENT_STATUS.ACTIVE).length,
      createdAt: place.get('createdAt'),
      updatedAt: place.get('updatedAt'),
    };
  }

  private isDuplicateKeyError(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error && (error as { code: number }).code === 11000;
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
}
