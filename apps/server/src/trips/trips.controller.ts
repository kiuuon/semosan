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
import { AddTripPlaceCommentDto } from './dto/add-trip-place-comment.dto';
import { AddTripPlaceDto } from './dto/add-trip-place.dto';
import { CreateFeedPostDto } from './dto/create-feed-post.dto';
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

  @Post(':id/places/:placeId/like')
  togglePlaceLike(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('placeId') placeId: string) {
    return this.tripsService.togglePlaceLike(id, placeId, req.user._id.toString());
  }

  @Get(':id/places/:placeId/comments')
  findPlaceComments(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('placeId') placeId: string) {
    return this.tripsService.findPlaceComments(id, placeId, req.user._id.toString());
  }

  @Post(':id/places/:placeId/comments')
  addPlaceComment(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('placeId') placeId: string,
    @Body() dto: AddTripPlaceCommentDto,
  ) {
    return this.tripsService.addPlaceComment(id, placeId, req.user._id.toString(), dto);
  }

  @Delete(':id/places/:placeId/comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removePlaceComment(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('placeId') placeId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.tripsService.removePlaceComment(id, placeId, commentId, req.user._id.toString());
  }

  @Get(':id/posts')
  findFeedPosts(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.tripsService.findFeedPosts(id, req.user._id.toString());
  }

  @Post(':id/posts')
  createFeedPost(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: CreateFeedPostDto) {
    return this.tripsService.createFeedPost(id, req.user._id.toString(), dto);
  }

  @Delete(':id/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeFeedPost(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('postId') postId: string) {
    return this.tripsService.removeFeedPost(id, postId, req.user._id.toString());
  }

  @Post(':id/posts/:postId/like')
  toggleFeedPostLike(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('postId') postId: string) {
    return this.tripsService.toggleFeedPostLike(id, postId, req.user._id.toString());
  }

  @Get(':id/posts/:postId/comments')
  findFeedPostComments(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('postId') postId: string) {
    return this.tripsService.findFeedPostComments(id, postId, req.user._id.toString());
  }

  @Post(':id/posts/:postId/comments')
  addFeedPostComment(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('postId') postId: string,
    @Body() dto: AddTripPlaceCommentDto,
  ) {
    return this.tripsService.addFeedPostComment(id, postId, req.user._id.toString(), dto);
  }

  @Delete(':id/posts/:postId/comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeFeedPostComment(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.tripsService.removeFeedPostComment(id, postId, commentId, req.user._id.toString());
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
