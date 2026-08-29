import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { FEED_POST_STATUS } from '../common/constants/feed';
import { PLACE_COMMENT_STATUS } from '../common/constants/place';

export type FeedPostDocument = HydratedDocument<FeedPost>;

@Schema()
export class FeedPostCommentEmbedded {
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

export const FeedPostCommentEmbeddedSchema = SchemaFactory.createForClass(FeedPostCommentEmbedded);

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

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  likedUserIds: Types.ObjectId[];

  @Prop({ type: [FeedPostCommentEmbeddedSchema], default: [] })
  comments: FeedPostCommentEmbedded[];

  @Prop({
    type: String,
    enum: Object.values(FEED_POST_STATUS),
    default: FEED_POST_STATUS.ACTIVE,
    required: true,
  })
  status: string;
}

export const FeedPostSchema = SchemaFactory.createForClass(FeedPost);

FeedPostSchema.index({ tripId: 1, status: 1, createdAt: -1 });
FeedPostSchema.index({ authorId: 1 });
