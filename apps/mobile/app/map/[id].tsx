import { useLocalSearchParams } from 'expo-router';

import TripMapScreen from '../../components/trip/map/TripMapScreen';

function asParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export default function TripMapRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  const tripId = asParam(params.id);

  return <TripMapScreen tripId={tripId} />;
}
