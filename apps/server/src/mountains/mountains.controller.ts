import { Controller, Get, Query } from '@nestjs/common';

import { SearchMountainsDto } from './dto/search-mountains.dto';
import { MountainsService } from './mountains.service';

@Controller('mountains')
export class MountainsController {
  constructor(private readonly mountainsService: MountainsService) {}

  @Get()
  search(@Query() dto: SearchMountainsDto) {
    return this.mountainsService.search(dto);
  }
}
