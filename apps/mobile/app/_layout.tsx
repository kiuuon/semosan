import { useState } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { AppToast } from '../components/common/toast/toastConfig';
import {
  NotoSansKR_400Regular,
  NotoSansKR_500Medium,
  NotoSansKR_600SemiBold,
  NotoSansKR_700Bold,
  NotoSansKR_800ExtraBold,
} from '@expo-google-fonts/noto-sans-kr';
import { DMMono_500Medium } from '@expo-google-fonts/dm-mono';

import { getApiErrorMessage } from '../lib/utils/getApiErrorMessage';
import colors from '../lib/constants/colors';

// 상단 인셋을 SafeAreaView가 아니라 각 화면의 contentStyle로 준다.
// 이렇게 해야 풀블리드 화면이 <Stack.Screen options={{ contentStyle: { paddingTop: 0 } }} />로 개별 해제할 수 있다.
function RootStack() {
  const insets = useSafeAreaInsets();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // paddingTop 영역(=상태바/노치)은 이 view의 배경색으로 칠해진다.
        contentStyle: { paddingTop: insets.top, backgroundColor: colors.white },
      }}
    />
  );
}

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
        <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
          <RootStack />
        </SafeAreaView>
      </SafeAreaProvider>
      <AppToast />
    </QueryClientProvider>
  );
}
