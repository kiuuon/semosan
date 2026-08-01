export const FEED_POST_STATUS = {
  ACTIVE: 'active',
  DELETED: 'deleted',
} as const;

export type FeedPostStatus = (typeof FEED_POST_STATUS)[keyof typeof FEED_POST_STATUS];
