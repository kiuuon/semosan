import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Place, PlaceSchema } from '../schemas/place.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Place.name, schema: PlaceSchema }])],
  exports: [MongooseModule],
})
export class PlacesModule {}
