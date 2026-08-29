import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { GetMountainDetailDto } from './dto/get-mountain-detail.dto';
import { RecommendMountainsDto } from './dto/recommend-mountains.dto';
import { SearchMountainsDto } from './dto/search-mountains.dto';
import { MountainsService } from './mountains.service';

@Controller('mountains')
export class MountainsController {
  constructor(private readonly mountainsService: MountainsService) {}

  @Get()
  search(@Query() dto: SearchMountainsDto) {
    return this.mountainsService.search(dto);
  }

  @Get('recommend')
  recommend(@Query() dto: RecommendMountainsDto) {
    return this.mountainsService.recommend(dto);
  }

  @Get(':id/coordinates')
  @UseGuards(JwtAuthGuard)
  getCoordinates(@Param('id') id: string, @Query() dto: GetMountainDetailDto) {
    return this.mountainsService.getCoordinates(id, dto);
  }

  @Get(':id')
  getDetail(@Param('id') id: string, @Query() dto: GetMountainDetailDto) {
    return this.mountainsService.getDetail(id, dto);
  }
}
