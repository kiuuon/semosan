import { Controller, Get, Param, Query } from '@nestjs/common';

import { GetMountainDetailDto } from './dto/get-mountain-detail.dto';
import { SearchMountainsDto } from './dto/search-mountains.dto';
import { MountainsService } from './mountains.service';

@Controller('mountains')
export class MountainsController {
  constructor(private readonly mountainsService: MountainsService) {}

  @Get()
  search(@Query() dto: SearchMountainsDto) {
    return this.mountainsService.search(dto);
  }

  @Get(':id')
  getDetail(@Param('id') id: string, @Query() dto: GetMountainDetailDto) {
    return this.mountainsService.getDetail(id, dto);
  }
}
