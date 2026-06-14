import { useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { getApiErrorMessage } from '../lib/utils/getApiErrorMessage';

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          mutations: {
            onError: (error: any) => {
              Toast.show({
                type: 'error',
                text1: getApiErrorMessage(error),
              });
            },
          },
        },
        queryCache: new QueryCache({
          onError: (error: any) => {
            Toast.show({
              type: 'error',
              text1: getApiErrorMessage(error),
            });
          },
        }),
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }} />
        </SafeAreaView>
      </SafeAreaProvider>
      <Toast />
    </QueryClientProvider>
  );
}
