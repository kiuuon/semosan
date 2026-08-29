import { Stack, useLocalSearchParams } from 'expo-router';

import TripMapScreen from '../../components/trip/map/TripMapScreen';
import colors from '../../lib/constants/colors';

function asParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export default function TripMapRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  const tripId = asParam(params.id);

  return (
    <>
      <Stack.Screen options={{ contentStyle: { paddingTop: 0, backgroundColor: colors.white } }} />
      <TripMapScreen tripId={tripId} />
    </>
  );
}
