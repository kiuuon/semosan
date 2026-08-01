import { Module } from '@nestjs/common';

import { MountainsController } from './mountains.controller';
import { MountainsService } from './mountains.service';

@Module({
  controllers: [MountainsController],
  providers: [MountainsService],
})
export class MountainsModule {}
