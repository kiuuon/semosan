import { useState } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {
  NotoSansKR_400Regular,
  NotoSansKR_500Medium,
  NotoSansKR_600SemiBold,
  NotoSansKR_700Bold,
  NotoSansKR_800ExtraBold,
} from '@expo-google-fonts/noto-sans-kr';
import { DMMono_500Medium } from '@expo-google-fonts/dm-mono';
import { getApiErrorMessage } from '../lib/utils/getApiErrorMessage';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    NotoSansKR_400Regular,
    NotoSansKR_500Medium,
    NotoSansKR_600SemiBold,
    NotoSansKR_700Bold,
    NotoSansKR_800ExtraBold,
    DMMono_500Medium,
  });

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

  if (!fontsLoaded) {
    return null;
  }

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
