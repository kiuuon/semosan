import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';

import type { AuthenticatedRequest } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTripDto } from './dto/create-trip.dto';
import { TripsService } from './trips.service';

@Controller('trips')
@UseGuards(JwtAuthGuard)
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  findMine(@Req() req: AuthenticatedRequest) {
    return this.tripsService.findMyTrips(req.user._id.toString());
  }

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateTripDto) {
    return this.tripsService.create(req.user._id.toString(), dto);
  }
}
