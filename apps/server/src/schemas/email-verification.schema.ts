import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EmailVerificationDocument = HydratedDocument<EmailVerification>;

@Schema({ timestamps: true })
export class EmailVerification {
  @Prop({ required: true, lowercase: true, trim: true, unique: true })
  email: string;

  @Prop({ required: true })
  codeHash: string;

  @Prop({ required: true })
  codeExpiresAt: Date;

  @Prop({ default: false })
  verified: boolean;

  @Prop()
  verificationTokenHash?: string;

  @Prop()
  tokenExpiresAt?: Date;

  @Prop()
  lastSentAt?: Date;
}

export const EmailVerificationSchema = SchemaFactory.createForClass(EmailVerification);
