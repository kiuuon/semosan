import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { AuthenticatedRequest } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddTripPlaceDto } from './dto/add-trip-place.dto';
import { CreateTripDto } from './dto/create-trip.dto';
import { JoinTripDto } from './dto/join-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { TripsService } from './trips.service';

@Controller('trips')
@UseGuards(JwtAuthGuard)
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  findMine(@Req() req: AuthenticatedRequest) {
    return this.tripsService.findMyTrips(req.user._id.toString());
  }

  @Post('join')
  join(@Req() req: AuthenticatedRequest, @Body() dto: JoinTripDto) {
    return this.tripsService.joinByInviteCode(req.user._id.toString(), dto.inviteCode);
  }

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateTripDto) {
    return this.tripsService.create(req.user._id.toString(), dto);
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.tripsService.findOneForMember(id, req.user._id.toString());
  }

  @Get(':id/places')
  findPlaces(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.tripsService.findPlaces(id, req.user._id.toString());
  }

  @Post(':id/places')
  addPlace(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: AddTripPlaceDto) {
    return this.tripsService.addPlace(id, req.user._id.toString(), dto);
  }

  @Delete(':id/places/:placeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removePlace(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('placeId') placeId: string) {
    return this.tripsService.removePlace(id, placeId, req.user._id.toString());
  }

  @Patch(':id')
  update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdateTripDto) {
    return this.tripsService.update(id, req.user._id.toString(), dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.tripsService.remove(id, req.user._id.toString());
  }
}
