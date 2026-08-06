import { Controller, Get, Query } from '@nestjs/common';

import { SearchPlacesDto } from './dto/search-places.dto';
import { PlacesService } from './places.service';

@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Get('search')
  search(@Query() dto: SearchPlacesDto) {
    return this.placesService.search(dto);
  }
}
