import getInstance from './instance';

export interface TripMountainSnapshot {
  externalId: string;
  name: string;
  region: string;
  height?: number;
  imageUrl?: string;
}

export interface CreateTripPayload {
  title?: string;
  mountain: TripMountainSnapshot;
  startDate: string;
  endDate: string;
}

export interface UpdateTripPayload {
  title: string;
  startDate: string;
  endDate: string;
}

export interface TripMember {
  userId: string;
  role: string;
  joinedAt: string;
  nickname: string;
}

export interface Trip {
  _id: string;
  ownerId: string;
  title?: string;
  mountain: TripMountainSnapshot;
  startDate: string;
  endDate: string;
  status: string;
  inviteCode: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TripDetail extends Trip {
  members: TripMember[];
}

export interface TripPlace {
  _id: string;
  tripId: string;
  externalId: string;
  contentTypeId: string;
  name: string;
  address?: string;
  imageUrl?: string;
  lat?: number | null;
  lng?: number | null;
  createdBy: string;
  likedUserIds: string[];
  commentCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddTripPlacePayload {
  externalId: string;
  contentTypeId: string;
  name: string;
  address?: string;
  imageUrl?: string;
  lat?: number | null;
  lng?: number | null;
}

export async function createTrip(payload: CreateTripPayload): Promise<Trip> {
  const instance = await getInstance();
  const response = await instance.post<Trip>('/trips', payload);
  return response.data;
}

export async function getMyTrips(): Promise<Trip[]> {
  const instance = await getInstance();
  const response = await instance.get<Trip[]>('/trips');
  return response.data;
}

export async function getTrip(tripId: string): Promise<TripDetail> {
  const instance = await getInstance();
  const response = await instance.get<TripDetail>(`/trips/${tripId}`);
  return response.data;
}

export async function updateTrip(tripId: string, payload: UpdateTripPayload): Promise<TripDetail> {
  const instance = await getInstance();
  const response = await instance.patch<TripDetail>(`/trips/${tripId}`, payload);
  return response.data;
}

export async function deleteTrip(tripId: string): Promise<void> {
  const instance = await getInstance();
  await instance.delete(`/trips/${tripId}`);
}

export async function joinTripByInviteCode(inviteCode: string): Promise<TripDetail> {
  const instance = await getInstance();
  const response = await instance.post<TripDetail>('/trips/join', {
    inviteCode: inviteCode.trim().toUpperCase(),
  });
  return response.data;
}

export async function getTripPlaces(tripId: string): Promise<TripPlace[]> {
  const instance = await getInstance();
  const response = await instance.get<TripPlace[]>(`/trips/${tripId}/places`);
  return response.data;
}

export async function addTripPlace(tripId: string, payload: AddTripPlacePayload): Promise<TripPlace> {
  const instance = await getInstance();
  const response = await instance.post<TripPlace>(`/trips/${tripId}/places`, {
    externalId: payload.externalId.trim(),
    contentTypeId: payload.contentTypeId.trim(),
    name: payload.name.trim(),
    ...(payload.address?.trim() ? { address: payload.address.trim() } : {}),
    ...(payload.imageUrl?.trim() ? { imageUrl: payload.imageUrl.trim() } : {}),
    ...(Number.isFinite(payload.lat) ? { lat: payload.lat } : {}),
    ...(Number.isFinite(payload.lng) ? { lng: payload.lng } : {}),
  });
  return response.data;
}

export async function removeTripPlace(tripId: string, placeId: string): Promise<void> {
  const instance = await getInstance();
  await instance.delete(`/trips/${tripId}/places/${placeId}`);
}

export interface TripPlaceComment {
  _id: string;
  userId: string;
  nickname: string;
  content: string;
  createdAt: string;
}

export async function toggleTripPlaceLike(tripId: string, placeId: string): Promise<TripPlace> {
  const instance = await getInstance();
  const response = await instance.post<TripPlace>(`/trips/${tripId}/places/${placeId}/like`);
  return response.data;
}

export async function getTripPlaceComments(tripId: string, placeId: string): Promise<TripPlaceComment[]> {
  const instance = await getInstance();
  const response = await instance.get<TripPlaceComment[]>(`/trips/${tripId}/places/${placeId}/comments`);
  return response.data;
}

export async function addTripPlaceComment(tripId: string, placeId: string, content: string): Promise<TripPlaceComment> {
  const instance = await getInstance();
  const response = await instance.post<TripPlaceComment>(`/trips/${tripId}/places/${placeId}/comments`, {
    content: content.trim(),
  });
  return response.data;
}

export async function removeTripPlaceComment(tripId: string, placeId: string, commentId: string): Promise<void> {
  const instance = await getInstance();
  await instance.delete(`/trips/${tripId}/places/${placeId}/comments/${commentId}`);
}

export interface TripFeedPost {
  _id: string;
  tripId: string;
  authorId: string;
  authorNickname: string;
  content: string;
  imageUrls: string[];
  likedUserIds: string[];
  commentCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TripFeedPostComment {
  _id: string;
  userId: string;
  nickname: string;
  content: string;
  createdAt: string;
}

export async function getTripFeedPosts(tripId: string): Promise<TripFeedPost[]> {
  const instance = await getInstance();
  const response = await instance.get<TripFeedPost[]>(`/trips/${tripId}/posts`);
  return response.data;
}

export async function createTripFeedPost(tripId: string, content: string): Promise<TripFeedPost> {
  const instance = await getInstance();
  const response = await instance.post<TripFeedPost>(`/trips/${tripId}/posts`, {
    content: content.trim(),
  });
  return response.data;
}

export async function removeTripFeedPost(tripId: string, postId: string): Promise<void> {
  const instance = await getInstance();
  await instance.delete(`/trips/${tripId}/posts/${postId}`);
}

export async function toggleTripFeedPostLike(tripId: string, postId: string): Promise<TripFeedPost> {
  const instance = await getInstance();
  const response = await instance.post<TripFeedPost>(`/trips/${tripId}/posts/${postId}/like`);
  return response.data;
}

export async function getTripFeedPostComments(tripId: string, postId: string): Promise<TripFeedPostComment[]> {
  const instance = await getInstance();
  const response = await instance.get<TripFeedPostComment[]>(`/trips/${tripId}/posts/${postId}/comments`);
  return response.data;
}

export async function addTripFeedPostComment(
  tripId: string,
  postId: string,
  content: string,
): Promise<TripFeedPostComment> {
  const instance = await getInstance();
  const response = await instance.post<TripFeedPostComment>(`/trips/${tripId}/posts/${postId}/comments`, {
    content: content.trim(),
  });
  return response.data;
}

export async function removeTripFeedPostComment(tripId: string, postId: string, commentId: string): Promise<void> {
  const instance = await getInstance();
  await instance.delete(`/trips/${tripId}/posts/${postId}/comments/${commentId}`);
}
