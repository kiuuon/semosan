import type { Region } from 'react-native-maps';

export const FALLBACK_MAP_REGION: Region = {
  latitude: 36.5,
  longitude: 127.9,
  latitudeDelta: 4.5,
  longitudeDelta: 4.5,
};

export const SINGLE_POINT_DELTA = 0.06;
const MULTI_POINT_PAD = 2.4;
const MIN_DELTA = 0.05;

export function isValidLatLng(lat: number | null | undefined, lng: number | null | undefined) {
  return typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng);
}

export function regionForCoordinates(
  points: Array<{ latitude: number; longitude: number }>,
  fallback: Region = FALLBACK_MAP_REGION,
): Region {
  if (points.length === 0) {
    return fallback;
  }

  if (points.length === 1) {
    return {
      latitude: points[0].latitude,
      longitude: points[0].longitude,
      latitudeDelta: SINGLE_POINT_DELTA,
      longitudeDelta: SINGLE_POINT_DELTA,
    };
  }

  const lats = points.map((point) => point.latitude);
  const lngs = points.map((point) => point.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * MULTI_POINT_PAD, MIN_DELTA),
    longitudeDelta: Math.max((maxLng - minLng) * MULTI_POINT_PAD, MIN_DELTA),
  };
}
