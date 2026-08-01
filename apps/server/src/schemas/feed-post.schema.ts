import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { FEED_POST_STATUS } from '../common/constants/feed';

export type FeedPostDocument = HydratedDocument<FeedPost>;

@Schema({ timestamps: true })
export class FeedPost {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Trip' })
  tripId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  authorId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ type: [String], default: [] })
  imageUrls?: string[];

  @Prop({
    type: String,
    enum: Object.values(FEED_POST_STATUS),
    default: FEED_POST_STATUS.ACTIVE,
    required: true,
  })
  status: string;
}

export const FeedPostSchema = SchemaFactory.createForClass(FeedPost);

FeedPostSchema.index({ tripId: 1, createdAt: -1 });
FeedPostSchema.index({ authorId: 1 });
