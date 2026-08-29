import { FALLBACK_MAP_REGION, isValidLatLng, regionForCoordinates } from './mapRegion';

describe('mapRegion', () => {
  it('accepts finite coordinates only', () => {
    expect(isValidLatLng(37.5, 127.0)).toBe(true);
    expect(isValidLatLng(null, 127.0)).toBe(false);
    expect(isValidLatLng(37.5, Number.NaN)).toBe(false);
  });

  it('returns fallback when there are no points', () => {
    expect(regionForCoordinates([])).toEqual(FALLBACK_MAP_REGION);
  });

  it('fits a single point', () => {
    expect(regionForCoordinates([{ latitude: 37.5, longitude: 127.0 }])).toEqual({
      latitude: 37.5,
      longitude: 127.0,
      latitudeDelta: 0.06,
      longitudeDelta: 0.06,
    });
  });

  it('fits multiple points with padding', () => {
    const region = regionForCoordinates([
      { latitude: 37.4, longitude: 126.9 },
      { latitude: 37.6, longitude: 127.1 },
    ]);

    expect(region.latitude).toBeCloseTo(37.5);
    expect(region.longitude).toBeCloseTo(127.0);
    expect(region.latitudeDelta).toBeCloseTo(0.48);
    expect(region.longitudeDelta).toBeCloseTo(0.48);
  });
});
