import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;

export const API_URL =
  process.env.EXPO_PUBLIC_SERVER_URL ?? extra?.apiUrl ?? 'http://localhost:3000';
