import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from '../auth/auth.module';
import { FeedPost, FeedPostSchema } from '../schemas/feed-post.schema';
import { Trip, TripSchema } from '../schemas/trip.schema';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Trip.name, schema: TripSchema },
      { name: FeedPost.name, schema: FeedPostSchema },
    ]),
  ],
  controllers: [TripsController],
  providers: [TripsService],
  exports: [MongooseModule, TripsService],
})
export class TripsModule {}
