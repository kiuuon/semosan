import { StyleSheet, Text, View } from 'react-native';
import Toast, { type ToastConfig } from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import colors from '../../../lib/constants/colors';

function ToastMessage({ text1 }: { text1?: string }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.toast}>
        <Text allowFontScaling={false} style={styles.text}>
          {text1}
        </Text>
      </View>
    </View>
  );
}

export const toastConfig: ToastConfig = {
  success: ({ text1 }) => <ToastMessage text1={text1} />,
  error: ({ text1 }) => <ToastMessage text1={text1} />,
  info: ({ text1 }) => <ToastMessage text1={text1} />,
};

export function AppToast() {
  const insets = useSafeAreaInsets();

  return <Toast position="bottom" bottomOffset={insets.bottom + 16} config={toastConfig} />;
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  toast: {
    backgroundColor: 'rgba(26, 26, 24, 0.88)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '100%',
  },
  text: {
    color: colors.white,
    fontFamily: 'NotoSansKR_500Medium',
    fontSize: 14,
    lineHeight: 14 * 1.6,
    textAlign: 'center',
  },
});
