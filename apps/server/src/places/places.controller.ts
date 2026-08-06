import { Controller, Get, Param, Query } from '@nestjs/common';

import { GetPlaceDetailDto } from './dto/get-place-detail.dto';
import { SearchPlacesDto } from './dto/search-places.dto';
import { PlacesService } from './places.service';

@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get('search')
  search(@Query() dto: SearchPlacesDto) {
    return this.placesService.search(dto);
  }

  @Get(':id')
  getDetail(@Param('id') id: string, @Query() dto: GetPlaceDetailDto) {
    return this.placesService.getDetail(id, dto);
  }
}
