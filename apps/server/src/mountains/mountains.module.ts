import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from '../auth/auth.module';
import { MountainCoord, MountainCoordSchema } from '../schemas/mountain-coord.schema';
import { KakaoLocalService } from './kakao-local.service';
import { MountainsController } from './mountains.controller';
import { MountainsService } from './mountains.service';

@Module({
  imports: [AuthModule, MongooseModule.forFeature([{ name: MountainCoord.name, schema: MountainCoordSchema }])],
  controllers: [MountainsController],
  providers: [MountainsService, KakaoLocalService],
})
export class MountainsModule {}
