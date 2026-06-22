import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { EmailVerificationType } from '../auth/types/email-verification-type';

export type EmailVerificationDocument = HydratedDocument<EmailVerification>;

@Schema({ timestamps: true })
export class EmailVerification {
  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, type: String, enum: EmailVerificationType })
  type: EmailVerificationType;

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

EmailVerificationSchema.index(
  { email: 1, type: 1 },
  {
    unique: true,
  },
);
