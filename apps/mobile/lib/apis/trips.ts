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
