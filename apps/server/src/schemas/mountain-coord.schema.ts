import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MountainCoordDocument = HydratedDocument<MountainCoord>;

@Schema({ timestamps: true })
export class MountainCoord {
  @Prop({ required: true, trim: true, unique: true })
  externalId: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  region: string;

  @Prop({ required: true, trim: true })
  query: string;

  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  lng: number;

  @Prop({ trim: true })
  placeName?: string;
}

export const MountainCoordSchema = SchemaFactory.createForClass(MountainCoord);
