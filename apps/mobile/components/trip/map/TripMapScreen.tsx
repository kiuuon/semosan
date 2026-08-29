import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

import Header from '../../common/header/Header';
import Typography from '../../common/typography/Typography';
import { getMountainCoordinates } from '../../../lib/apis/mountains';
import { getPlaceDetail } from '../../../lib/apis/places';
import { getTrip, getTripPlaces, type TripPlace } from '../../../lib/apis/trips';
import colors from '../../../lib/constants/colors';
import {
  FALLBACK_MAP_REGION,
  isValidLatLng,
  regionForCoordinates,
  SINGLE_POINT_DELTA,
} from '../../../lib/utils/mapRegion';

type MappedPlace = {
  _id: string;
  externalId: string;
  contentTypeId: string;
  name: string;
  latitude: number;
  longitude: number;
};

function asCoord(place: Pick<TripPlace, 'lat' | 'lng'>) {
  if (!isValidLatLng(place.lat, place.lng)) {
    return null;
  }
  return { latitude: place.lat as number, longitude: place.lng as number };
}

async function resolvePlaceCoords(places: TripPlace[]): Promise<MappedPlace[]> {
  const resolved = await Promise.all(
    places.map(async (place) => {
      const stored = asCoord(place);
      if (stored) {
        return {
          _id: place._id,
          externalId: place.externalId,
          contentTypeId: place.contentTypeId,
          name: place.name,
          ...stored,
        };
      }

      try {
        const detail = await getPlaceDetail({
          id: place.externalId,
          contentTypeId: place.contentTypeId,
        });
        if (!isValidLatLng(detail.lat, detail.lng)) {
          return null;
        }
        return {
          _id: place._id,
          externalId: place.externalId,
          contentTypeId: place.contentTypeId,
          name: place.name,
          latitude: detail.lat as number,
          longitude: detail.lng as number,
        };
      } catch {
        return null;
      }
    }),
  );

  return resolved.filter((place): place is MappedPlace => place !== null);
}

async function resolveMountainCoord(params: { id: string; name: string; region: string }) {
  try {
    const coord = await getMountainCoordinates(params);
    if (!isValidLatLng(coord.lat, coord.lng)) {
      return null;
    }
    return coord;
  } catch (error) {
    if (axios.isAxiosError(error) && (error.response?.status === 429 || error.response?.status === 404)) {
      return null;
    }
    return null;
  }
}

interface TripMapScreenProps {
  tripId: string;
}

function TripMapScreen({ tripId }: TripMapScreenProps) {
  const mapRef = useRef<MapView>(null);
  const [userRegion, setUserRegion] = useState<Region | null>(null);

  const { data: trip, isPending: isTripPending } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => getTrip(tripId),
    enabled: tripId.length > 0,
  });

  const { data: places = [], isPending } = useQuery({
    queryKey: ['trip', tripId, 'places'],
    queryFn: () => getTripPlaces(tripId),
    enabled: tripId.length > 0,
  });

  const { data: mappedPlaces = [], isPending: isResolvingCoords } = useQuery({
    queryKey: ['trip', tripId, 'map-coords', places.map((place) => `${place._id}:${place.lat}:${place.lng}`).join('|')],
    queryFn: () => resolvePlaceCoords(places),
    enabled: tripId.length > 0 && !isPending,
  });

  const { data: mountainCoord, isPending: isMountainPending } = useQuery({
    queryKey: ['trip', tripId, 'mountain-coord', trip?.mountain.externalId, trip?.mountain.name, trip?.mountain.region],
    queryFn: () => {
      const mountain = trip?.mountain;
      if (!mountain) {
        return Promise.resolve(null);
      }
      return resolveMountainCoord({
        id: mountain.externalId,
        name: mountain.name,
        region: mountain.region,
      });
    },
    enabled: Boolean(trip?.mountain.externalId && trip.mountain.name && trip.mountain.region),
    retry: false,
  });

  useEffect(() => {
    let cancelled = false;

    const loadUserLocation = async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted' || cancelled) {
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (cancelled) {
        return;
      }

      setUserRegion({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        latitudeDelta: SINGLE_POINT_DELTA,
        longitudeDelta: SINGLE_POINT_DELTA,
      });
    };

    void loadUserLocation();

    return () => {
      cancelled = true;
    };
  }, []);

  const mountainPoint = useMemo(() => {
    if (!mountainCoord || !isValidLatLng(mountainCoord.lat, mountainCoord.lng)) {
      return null;
    }
    return { latitude: mountainCoord.lat, longitude: mountainCoord.lng };
  }, [mountainCoord]);

  const region = useMemo(() => {
    const markerPoints = [
      ...mappedPlaces.map((place) => ({
        latitude: place.latitude,
        longitude: place.longitude,
      })),
      ...(mountainPoint ? [mountainPoint] : []),
    ];
    if (markerPoints.length > 0) {
      return regionForCoordinates(markerPoints);
    }
    return userRegion ?? FALLBACK_MAP_REGION;
  }, [mappedPlaces, mountainPoint, userRegion]);

  useEffect(() => {
    mapRef.current?.animateToRegion(region, 350);
  }, [region]);

  const loading = isTripPending || isPending || isResolvingCoords || (Boolean(trip) && isMountainPending);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.screen}>
        <Header title="지도" />
        <View style={styles.centered}>
          <Typography.BodyBase color={colors.stone500}>지도는 iOS/Android 앱에서 볼 수 있습니다.</Typography.BodyBase>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header title="지도" />
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          showsUserLocation
          showsMyLocationButton
          toolbarEnabled={false}
        >
          {mountainPoint ? (
            <Marker
              coordinate={mountainPoint}
              title={trip?.mountain.name ?? mountainCoord?.name}
              description={mountainCoord?.placeName}
              pinColor={colors.summit700}
            />
          ) : null}

          {mappedPlaces.map((place) => (
            <Marker
              key={place._id}
              coordinate={{ latitude: place.latitude, longitude: place.longitude }}
              title={place.name}
              pinColor={colors.forest700}
              onCalloutPress={() =>
                router.push({
                  pathname: '/place/[id]',
                  params: {
                    id: place.externalId,
                    contentTypeId: place.contentTypeId,
                    name: place.name,
                    tripId,
                  },
                })
              }
            />
          ))}
        </MapView>

        {loading ? (
          <View style={styles.overlay} pointerEvents="none">
            <ActivityIndicator color={colors.forest700} />
          </View>
        ) : null}

        {!loading && mappedPlaces.length === 0 && !mountainPoint ? (
          <View style={styles.banner} pointerEvents="none">
            <Typography.Caption color={colors.stone700}>
              추가한 장소 마커가 없으면 내 위치만 표시됩니다.
            </Typography.Caption>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  mapWrap: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  banner: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.stone100,
  },
});

export default TripMapScreen;
