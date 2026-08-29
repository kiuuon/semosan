import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { Model, Types } from 'mongoose';

import { FEED_POST_STATUS } from '../common/constants/feed';
import { PLACE_COMMENT_STATUS, TRIP_PLACE_STATUS } from '../common/constants/place';
import { TRIP_MEMBER_ROLE, TRIP_STATUS } from '../common/constants/trip';
import { FeedPost, FeedPostDocument } from '../schemas/feed-post.schema';
import { TripPlace, TripPlaceDocument } from '../schemas/trip-place.schema';
import { Trip, TripDocument } from '../schemas/trip.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { AddTripPlaceCommentDto } from './dto/add-trip-place-comment.dto';
import { AddTripPlaceDto } from './dto/add-trip-place.dto';
import { CreateFeedPostDto } from './dto/create-feed-post.dto';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';

const INVITE_CODE_BYTES = 4;
const INVITE_CODE_MAX_RETRY = 5;
const MAX_TRIP_DAYS = 30;

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
  lat?: number;
  lng?: number;
  createdBy: string;
  likedUserIds: string[];
  commentCount: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type TripPlaceCommentResponse = {
  _id: string;
  userId: string;
  nickname: string;
  content: string;
  createdAt: Date;
};

export type FeedPostResponse = {
  _id: string;
  tripId: string;
  authorId: string;
  authorNickname: string;
  content: string;
  imageUrls: string[];
  likedUserIds: string[];
  commentCount: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type FeedPostCommentResponse = TripPlaceCommentResponse;

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
export class TripsService implements OnModuleInit {
  private readonly logger = new Logger(TripsService.name);

  constructor(
    @InjectModel(Trip.name) private readonly tripModel: Model<TripDocument>,
    @InjectModel(TripPlace.name) private readonly tripPlaceModel: Model<TripPlaceDocument>,
    @InjectModel(FeedPost.name) private readonly feedPostModel: Model<FeedPostDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async onModuleInit() {
    try {
      await Promise.all([this.tripPlaceModel.syncIndexes(), this.feedPostModel.syncIndexes()]);
    } catch (error) {
      this.logger.warn('Failed to sync TripPlace/FeedPost indexes', error);
    }
  }

  async create(userId: string, dto: CreateTripDto): Promise<TripDocument> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('유효하지 않은 날짜입니다.');
    }

    if (endDate.getTime() < startDate.getTime()) {
      throw new BadRequestException('종료일은 시작일 이후여야 합니다.');
    }

    this.assertTripWithinMaxDays(startDate, endDate);

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

    this.assertTripWithinMaxDays(startDate, endDate);

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
    const lat = Number.isFinite(dto.lat) ? dto.lat : undefined;
    const lng = Number.isFinite(dto.lng) ? dto.lng : undefined;

    const activeExisting = await this.tripPlaceModel
      .findOne({ tripId: trip._id, externalId, status: TRIP_PLACE_STATUS.ACTIVE })
      .exec();
    if (activeExisting) {
      throw new ConflictException('이미 일정에 추가된 장소입니다.');
    }

    try {
      const place = await this.tripPlaceModel.create({
        tripId: trip._id,
        externalId,
        contentTypeId,
        name,
        address,
        imageUrl,
        lat,
        lng,
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

    const place = await this.getActivePlaceOrThrow(tripId, placeId);
    place.status = TRIP_PLACE_STATUS.DELETED;
    await place.save();
  }

  async togglePlaceLike(tripId: string, placeId: string, userId: string): Promise<TripPlaceResponse> {
    const trip = await this.getActiveTripOrThrow(tripId);
    this.assertMember(trip, userId);

    const place = await this.getActivePlaceOrThrow(tripId, placeId);
    const userObjectId = new Types.ObjectId(userId);
    const likedIndex = place.likedUserIds.findIndex((id) => id.toString() === userId);

    if (likedIndex >= 0) {
      place.likedUserIds.splice(likedIndex, 1);
    } else {
      place.likedUserIds.push(userObjectId);
    }

    await place.save();
    return this.toPlaceResponse(place);
  }

  async findPlaceComments(tripId: string, placeId: string, userId: string): Promise<TripPlaceCommentResponse[]> {
    const trip = await this.getActiveTripOrThrow(tripId);
    this.assertMember(trip, userId);

    const place = await this.getActivePlaceOrThrow(tripId, placeId);
    return await this.toCommentResponses(place.comments);
  }

  async addPlaceComment(
    tripId: string,
    placeId: string,
    userId: string,
    dto: AddTripPlaceCommentDto,
  ): Promise<TripPlaceCommentResponse> {
    const trip = await this.getActiveTripOrThrow(tripId);
    this.assertMember(trip, userId);

    const place = await this.getActivePlaceOrThrow(tripId, placeId);
    const content = dto.content.trim();
    if (!content) {
      throw new BadRequestException('댓글 내용을 입력해 주세요.');
    }

    place.comments.push({
      userId: new Types.ObjectId(userId),
      content,
      status: PLACE_COMMENT_STATUS.ACTIVE,
      createdAt: new Date(),
    });
    await place.save();

    const created = place.comments[place.comments.length - 1];
    const user = await this.userModel.findById(userId).select('nickname').exec();

    return {
      _id: this.getEmbeddedCommentId(created),
      userId,
      nickname: user?.nickname ?? '알 수 없음',
      content: created.content,
      createdAt: created.createdAt,
    };
  }

  async findFeedPosts(tripId: string, userId: string): Promise<FeedPostResponse[]> {
    const trip = await this.getActiveTripOrThrow(tripId);
    this.assertMember(trip, userId);

    const posts = await this.feedPostModel
      .find({ tripId: trip._id, status: FEED_POST_STATUS.ACTIVE })
      .sort({ createdAt: -1 })
      .exec();

    const authorIds = [...new Set(posts.map((post) => post.authorId.toString()))];
    const users = await this.userModel
      .find({ _id: { $in: authorIds.map((id) => new Types.ObjectId(id)) } })
      .select('_id nickname')
      .exec();
    const nicknameById = new Map(users.map((user) => [user._id.toString(), user.nickname]));

    return posts.map((post) => this.toFeedPostResponse(post, nicknameById));
  }

  async createFeedPost(tripId: string, userId: string, dto: CreateFeedPostDto): Promise<FeedPostResponse> {
    const trip = await this.getActiveTripOrThrow(tripId);
    this.assertMember(trip, userId);

    const content = dto.content.trim();
    if (!content) {
      throw new BadRequestException('내용을 입력해 주세요.');
    }

    const post = await this.feedPostModel.create({
      tripId: trip._id,
      authorId: new Types.ObjectId(userId),
      content,
      imageUrls: [],
      likedUserIds: [],
      comments: [],
      status: FEED_POST_STATUS.ACTIVE,
    });

    const author = await this.userModel.findById(userId).select('nickname').exec();
    const nicknameById = new Map([[userId, author?.nickname ?? '알 수 없음']]);

    return this.toFeedPostResponse(post, nicknameById);
  }

  async removeFeedPost(tripId: string, postId: string, userId: string): Promise<void> {
    const trip = await this.getActiveTripOrThrow(tripId);
    this.assertMember(trip, userId);

    const post = await this.getActiveFeedPostOrThrow(tripId, postId);
    if (post.authorId.toString() !== userId) {
      throw new ForbiddenException('본인 글만 삭제할 수 있습니다.');
    }

    post.status = FEED_POST_STATUS.DELETED;
    await post.save();
  }

  async toggleFeedPostLike(tripId: string, postId: string, userId: string): Promise<FeedPostResponse> {
    const trip = await this.getActiveTripOrThrow(tripId);
    this.assertMember(trip, userId);

    const post = await this.getActiveFeedPostOrThrow(tripId, postId);
    const userObjectId = new Types.ObjectId(userId);
    const likedIndex = post.likedUserIds.findIndex((id) => id.toString() === userId);

    if (likedIndex >= 0) {
      post.likedUserIds.splice(likedIndex, 1);
    } else {
      post.likedUserIds.push(userObjectId);
    }

    await post.save();

    const author = await this.userModel.findById(post.authorId).select('nickname').exec();
    const nicknameById = new Map([[post.authorId.toString(), author?.nickname ?? '알 수 없음']]);

    return this.toFeedPostResponse(post, nicknameById);
  }

  async findFeedPostComments(tripId: string, postId: string, userId: string): Promise<FeedPostCommentResponse[]> {
    const trip = await this.getActiveTripOrThrow(tripId);
    this.assertMember(trip, userId);

    const post = await this.getActiveFeedPostOrThrow(tripId, postId);
    return await this.toCommentResponses(post.comments);
  }

  async addFeedPostComment(
    tripId: string,
    postId: string,
    userId: string,
    dto: AddTripPlaceCommentDto,
  ): Promise<FeedPostCommentResponse> {
    const trip = await this.getActiveTripOrThrow(tripId);
    this.assertMember(trip, userId);

    const post = await this.getActiveFeedPostOrThrow(tripId, postId);
    const content = dto.content.trim();
    if (!content) {
      throw new BadRequestException('댓글 내용을 입력해 주세요.');
    }

    post.comments.push({
      userId: new Types.ObjectId(userId),
      content,
      status: PLACE_COMMENT_STATUS.ACTIVE,
      createdAt: new Date(),
    });
    await post.save();

    const created = post.comments[post.comments.length - 1];
    const user = await this.userModel.findById(userId).select('nickname').exec();

    return {
      _id: this.getEmbeddedCommentId(created),
      userId,
      nickname: user?.nickname ?? '알 수 없음',
      content: created.content,
      createdAt: created.createdAt,
    };
  }

  async removeFeedPostComment(tripId: string, postId: string, commentId: string, userId: string): Promise<void> {
    const trip = await this.getActiveTripOrThrow(tripId);
    this.assertMember(trip, userId);

    if (!Types.ObjectId.isValid(commentId)) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    const post = await this.getActiveFeedPostOrThrow(tripId, postId);
    const comment = post.comments.find(
      (item) => this.getEmbeddedCommentId(item) === commentId && item.status === PLACE_COMMENT_STATUS.ACTIVE,
    );

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    if (comment.userId.toString() !== userId) {
      throw new ForbiddenException('본인 댓글만 삭제할 수 있습니다.');
    }

    comment.status = PLACE_COMMENT_STATUS.DELETED;
    await post.save();
  }

  async removePlaceComment(tripId: string, placeId: string, commentId: string, userId: string): Promise<void> {
    const trip = await this.getActiveTripOrThrow(tripId);
    this.assertMember(trip, userId);

    if (!Types.ObjectId.isValid(commentId)) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    const place = await this.getActivePlaceOrThrow(tripId, placeId);
    const comment = place.comments.find(
      (item) => this.getEmbeddedCommentId(item) === commentId && item.status === PLACE_COMMENT_STATUS.ACTIVE,
    );

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    if (comment.userId.toString() !== userId) {
      throw new ForbiddenException('본인 댓글만 삭제할 수 있습니다.');
    }

    comment.status = PLACE_COMMENT_STATUS.DELETED;
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

  private async getActiveFeedPostOrThrow(tripId: string, postId: string): Promise<FeedPostDocument> {
    if (!Types.ObjectId.isValid(tripId) || !Types.ObjectId.isValid(postId)) {
      throw new NotFoundException('글을 찾을 수 없습니다.');
    }

    const post = await this.feedPostModel
      .findOne({ _id: postId, tripId: new Types.ObjectId(tripId), status: FEED_POST_STATUS.ACTIVE })
      .exec();
    if (!post) {
      throw new NotFoundException('글을 찾을 수 없습니다.');
    }

    return post;
  }

  private async getActivePlaceOrThrow(tripId: string, placeId: string): Promise<TripPlaceDocument> {
    if (!Types.ObjectId.isValid(tripId) || !Types.ObjectId.isValid(placeId)) {
      throw new NotFoundException('추가된 장소를 찾을 수 없습니다.');
    }

    const place = await this.tripPlaceModel
      .findOne({ _id: placeId, tripId: new Types.ObjectId(tripId), status: TRIP_PLACE_STATUS.ACTIVE })
      .exec();
    if (!place) {
      throw new NotFoundException('추가된 장소를 찾을 수 없습니다.');
    }

    return place;
  }

  private assertTripWithinMaxDays(startDate: Date, endDate: Date): void {
    const start = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
    const end = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());
    const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (days > MAX_TRIP_DAYS) {
      throw new BadRequestException(`일정은 최대 ${MAX_TRIP_DAYS}일까지 설정할 수 있습니다.`);
    }
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

  private toFeedPostResponse(post: FeedPostDocument, nicknameById: Map<string, string>): FeedPostResponse {
    return {
      _id: post._id.toString(),
      tripId: post.tripId.toString(),
      authorId: post.authorId.toString(),
      authorNickname: nicknameById.get(post.authorId.toString()) ?? '알 수 없음',
      content: post.content,
      imageUrls: post.imageUrls ?? [],
      likedUserIds: post.likedUserIds.map((id) => id.toString()),
      commentCount: post.comments.filter((comment) => comment.status === PLACE_COMMENT_STATUS.ACTIVE).length,
      createdAt: post.get('createdAt'),
      updatedAt: post.get('updatedAt'),
    };
  }

  private async toCommentResponses(
    comments: Array<{ userId: Types.ObjectId; content: string; status: string; createdAt: Date; _id?: Types.ObjectId }>,
  ): Promise<TripPlaceCommentResponse[]> {
    const activeComments = comments.filter((comment) => comment.status === PLACE_COMMENT_STATUS.ACTIVE);
    const commentUserIds = activeComments.map((comment) => comment.userId);
    const users = await this.userModel
      .find({ _id: { $in: commentUserIds } })
      .select('_id nickname')
      .exec();
    const nicknameById = new Map(users.map((user) => [user._id.toString(), user.nickname]));

    return activeComments
      .slice()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((comment) => ({
        _id: this.getEmbeddedCommentId(comment),
        userId: comment.userId.toString(),
        nickname: nicknameById.get(comment.userId.toString()) ?? '알 수 없음',
        content: comment.content,
        createdAt: comment.createdAt,
      }));
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
      lat: place.lat,
      lng: place.lng,
      createdBy: place.createdBy.toString(),
      likedUserIds: place.likedUserIds.map((id) => id.toString()),
      commentCount: place.comments.filter((comment) => comment.status === PLACE_COMMENT_STATUS.ACTIVE).length,
      createdAt: place.get('createdAt'),
      updatedAt: place.get('updatedAt'),
    };
  }

  private getEmbeddedCommentId(comment: { _id?: Types.ObjectId } | TripPlace['comments'][number]): string {
    const id = (comment as { _id?: Types.ObjectId })._id;
    return id?.toString() ?? new Types.ObjectId().toString();
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
