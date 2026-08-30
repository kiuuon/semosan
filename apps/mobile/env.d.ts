/// <reference types="expo/types" />

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_SERVER_URL?: string;
    GOOGLE_MAPS_API_KEY?: string;
  }
}
