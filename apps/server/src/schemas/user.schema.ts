import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { USER_STATUS } from '../common/constants/status';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, trim: true })
  nickname: string;

  @Prop()
  height?: number;

  @Prop()
  weight?: number;

  @Prop()
  gender?: string;

  @Prop()
  age?: number;

  @Prop({
    type: String,
    enum: USER_STATUS,
    default: USER_STATUS.ACTIVE,
    required: true,
  })
  status: string;

  @Prop({ type: Date })
  termsAgreedAt?: Date;

  @Prop({ type: Date })
  privacyAgreedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { status: USER_STATUS.ACTIVE },
  },
);

UserSchema.index(
  { nickname: 1 },
  {
    unique: true,
    partialFilterExpression: { status: USER_STATUS.ACTIVE },
  },
);
