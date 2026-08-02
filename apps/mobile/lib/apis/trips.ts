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
