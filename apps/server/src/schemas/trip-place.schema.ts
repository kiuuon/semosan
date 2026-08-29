import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { PLACE_COMMENT_STATUS, TOUR_CONTENT_TYPE_IDS, TRIP_PLACE_STATUS } from '../common/constants/place';

export type TripPlaceDocument = HydratedDocument<TripPlace>;

@Schema()
export class TripPlaceCommentEmbedded {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({
    type: String,
    enum: Object.values(PLACE_COMMENT_STATUS),
    default: PLACE_COMMENT_STATUS.ACTIVE,
    required: true,
  })
  status: string;

  @Prop({ required: true, default: () => new Date() })
  createdAt: Date;
}

export const TripPlaceCommentEmbeddedSchema = SchemaFactory.createForClass(TripPlaceCommentEmbedded);

@Schema({ timestamps: true })
export class TripPlace {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Trip', index: true })
  tripId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  externalId: string;

  @Prop({
    type: String,
    enum: TOUR_CONTENT_TYPE_IDS,
    required: true,
  })
  contentTypeId: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ trim: true })
  imageUrl?: string;

  @Prop({ type: Number })
  lat?: number;

  @Prop({ type: Number })
  lng?: number;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  likedUserIds: Types.ObjectId[];

  @Prop({ type: [TripPlaceCommentEmbeddedSchema], default: [] })
  comments: TripPlaceCommentEmbedded[];

  @Prop({
    type: String,
    enum: Object.values(TRIP_PLACE_STATUS),
    default: TRIP_PLACE_STATUS.ACTIVE,
    required: true,
  })
  status: string;
}

export const TripPlaceSchema = SchemaFactory.createForClass(TripPlace);

TripPlaceSchema.index({ tripId: 1, status: 1, createdAt: -1 });
TripPlaceSchema.index(
  { tripId: 1, externalId: 1 },
  { unique: true, partialFilterExpression: { status: TRIP_PLACE_STATUS.ACTIVE } },
);
TripPlaceSchema.index({ createdBy: 1 });
