import axios from "axios";

const geocodeCache = new Map();

export async function reverseGeocode(lat, lng, precision = 6) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return "-";
  }

  const latNum = Number(lat);
  const lngNum = Number(lng);
  const cacheKey = `${latNum.toFixed(precision)},${lngNum.toFixed(precision)}`;

  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  try {
    const res = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latNum}&lon=${lngNum}&accept-language=vi`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (res.data?.display_name) {
      geocodeCache.set(cacheKey, res.data.display_name);
      return res.data.display_name;
    }
  } catch {
    // Fallback to coordinates when geocoding API fails.
  }

  const fallback = `${latNum.toFixed(precision)}, ${lngNum.toFixed(precision)}`;
  geocodeCache.set(cacheKey, fallback);
  return fallback;
}
