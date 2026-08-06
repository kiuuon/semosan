import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import Typography from '../../../components/common/typography/Typography';
import colors from '../../../lib/constants/colors';

export default function TripHomeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Typography.Caption color={colors.stone500}>tripId: {id}</Typography.Caption>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 8,
    backgroundColor: colors.white,
  },
});
