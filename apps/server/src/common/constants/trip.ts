export const TRIP_STATUS = {
  PLANNING: 'planning',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type TripStatus = (typeof TRIP_STATUS)[keyof typeof TRIP_STATUS];

export const TRIP_MEMBER_ROLE = {
  OWNER: 'owner',
  MEMBER: 'member',
} as const;

export type TripMemberRole = (typeof TRIP_MEMBER_ROLE)[keyof typeof TRIP_MEMBER_ROLE];

export const TRIP_STOP_CATEGORY = {
  RESTAURANT: 'restaurant',
  ATTRACTION: 'attraction',
  LODGING: 'lodging',
  MEETUP: 'meetup',
  OTHER: 'other',
} as const;

export type TripStopCategory = (typeof TRIP_STOP_CATEGORY)[keyof typeof TRIP_STOP_CATEGORY];
