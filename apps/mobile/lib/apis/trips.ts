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
