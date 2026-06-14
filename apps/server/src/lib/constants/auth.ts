/** Access JWT lifetime — short-lived to limit exposure if leaked. */
export const ACCESS_TOKEN_EXPIRES_IN = '15m';

/** Access token lifetime in seconds (for client `expiresIn`). */
export const ACCESS_TOKEN_EXPIRES_SECONDS = 15 * 60;

/** Opaque refresh token lifetime — balance UX and revocation window. */
export const REFRESH_TOKEN_EXPIRES_MS = 30 * 24 * 60 * 60 * 1000;

export const REFRESH_TOKEN_BYTES = 32;
