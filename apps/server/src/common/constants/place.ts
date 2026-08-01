export const PLACE_COMMENT_STATUS = {
  ACTIVE: 'active',
  DELETED: 'deleted',
} as const;

export type PlaceCommentStatus = (typeof PLACE_COMMENT_STATUS)[keyof typeof PLACE_COMMENT_STATUS];
