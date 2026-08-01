import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { PLACE_COMMENT_STATUS } from '../common/constants/place';

export type PlaceDocument = HydratedDocument<Place>;

@Schema({ timestamps: true })
export class PlaceCommentEmbedded {
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
}

export const PlaceCommentEmbeddedSchema = SchemaFactory.createForClass(PlaceCommentEmbedded);

@Schema({ timestamps: true })
export class Place {
  @Prop({ required: true, trim: true })
  provider: string;

  @Prop({ required: true, trim: true })
  externalId: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  address?: string;

  @Prop({ type: Number })
  lat?: number;

  @Prop({ type: Number })
  lng?: number;

  @Prop({ trim: true })
  category?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  likedUserIds: Types.ObjectId[];

  @Prop({ type: [PlaceCommentEmbeddedSchema], default: [] })
  comments: PlaceCommentEmbedded[];
}

export const PlaceSchema = SchemaFactory.createForClass(Place);

PlaceSchema.index({ provider: 1, externalId: 1 }, { unique: true });
