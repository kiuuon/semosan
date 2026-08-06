import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { TRIP_MEMBER_ROLE, TRIP_STATUS } from '../common/constants/trip';

export type TripDocument = HydratedDocument<Trip>;

@Schema({ _id: false })
export class TripMountainSnapshot {
  @Prop({ required: true, trim: true })
  externalId: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  region: string;

  @Prop()
  height?: number;

  @Prop()
  imageUrl?: string;
}

export const TripMountainSnapshotSchema = SchemaFactory.createForClass(TripMountainSnapshot);

@Schema({ _id: false })
export class TripMemberEmbedded {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(TRIP_MEMBER_ROLE),
    required: true,
  })
  role: string;

  @Prop({ required: true, default: () => new Date() })
  joinedAt: Date;
}

export const TripMemberEmbeddedSchema = SchemaFactory.createForClass(TripMemberEmbedded);

@Schema({ timestamps: true })
export class Trip {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  ownerId: Types.ObjectId;

  @Prop({ trim: true })
  title?: string;

  @Prop({ type: TripMountainSnapshotSchema, required: true })
  mountain: TripMountainSnapshot;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({
    type: String,
    enum: Object.values(TRIP_STATUS),
    default: TRIP_STATUS.PLANNING,
    required: true,
  })
  status: string;

  @Prop({ required: true, trim: true, uppercase: true })
  inviteCode: string;

  @Prop({ type: [TripMemberEmbeddedSchema], default: [] })
  members: TripMemberEmbedded[];
}

export const TripSchema = SchemaFactory.createForClass(Trip);

TripSchema.index({ ownerId: 1, startDate: -1 });
TripSchema.index({ status: 1, startDate: -1 });
TripSchema.index({ inviteCode: 1 }, { unique: true });
TripSchema.index({ 'members.userId': 1 });
