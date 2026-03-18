import axios from "axios";

const geocodeCache = new Map();
const searchCache = new Map();

const GOONG_MIN_INTERVAL_MS = 300;
const MAX_429_RETRIES = 2;
const GOONG_GEOCODE_URL = "https://rsapi.goong.io/Geocode";
const GOONG_AUTOCOMPLETE_URL = "https://rsapi.goong.io/place/autocomplete";

// HCM coordinates
const HCM_LOCATION = "10.7683,106.6817";
const HCM_SEARCH_RADIUS = 50; // km

const GOONG_API_KEY = (
  import.meta.env?.VITE_GOONG_MAPS_API_KEY ||
  import.meta.env?.["VITE_GOONG_MAPS_API_KEY "] ||
  ""
).trim();

let lastRequestTime = 0;
let requestQueue = Promise.resolve();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function rateLimitedRequest(fn) {
  const run = async () => {
    const now = Date.now();
    const diff = now - lastRequestTime;

    if (diff < GOONG_MIN_INTERVAL_MS) {
      await sleep(GOONG_MIN_INTERVAL_MS - diff);
    }

    try {
      return await fn();
    } finally {
      lastRequestTime = Date.now();
    }
  };

  const queued = requestQueue.then(run, run);
  requestQueue = queued.catch(() => {});
  return queued;
}

async function requestWithRetry(fn, retries = MAX_429_RETRIES) {
  try {
    return await fn();
  } catch (error) {
    const status = error?.response?.status;
    const isCanceled = error?.code === "ERR_CANCELED";

    if (isCanceled) {
      throw error;
    }

    if (status === 429 && retries > 0) {
      await sleep(1500);
      return requestWithRetry(fn, retries - 1);
    }

    throw error;
  }
}

function getAddressComponent(components = [], type) {
  return components.find(
    (component) =>
      Array.isArray(component?.types) && component.types.includes(type),
  );
}

function parseGoongAddress(result = {}) {
  const components = Array.isArray(result?.address_components)
    ? result.address_components
    : [];

  const houseNumber =
    getAddressComponent(components, "street_number")?.long_name ||
    getAddressComponent(components, "premise")?.long_name ||
    "";
  const road =
    getAddressComponent(components, "route")?.long_name ||
    getAddressComponent(components, "street")?.long_name ||
    "";
  const suburb =
    getAddressComponent(components, "sublocality_level_1")?.long_name ||
    getAddressComponent(components, "sublocality")?.long_name ||
    getAddressComponent(components, "ward")?.long_name ||
    "";
  const district =
    getAddressComponent(components, "administrative_area_level_2")?.long_name ||
    getAddressComponent(components, "district")?.long_name ||
    "";
  const city =
    getAddressComponent(components, "administrative_area_level_1")?.long_name ||
    getAddressComponent(components, "locality")?.long_name ||
    "";

  const formattedAddress = result?.formatted_address || "";

  return {
    address: formattedAddress,
    houseNumber,
    road,
    suburb,
    district,
    city,
    lat: Number(result?.geometry?.location?.lat),
    lng: Number(result?.geometry?.location?.lng),
  };
}

function buildDetailedAddressText(parsedAddress) {
  const firstLine = [parsedAddress.houseNumber, parsedAddress.road]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (!parsedAddress.address) {
    return firstLine || "";
  }

  if (!firstLine) {
    return parsedAddress.address;
  }

  const normalizedAddress = parsedAddress.address.toLowerCase();
  const normalizedFirstLine = firstLine.toLowerCase();
  if (normalizedAddress.includes(normalizedFirstLine)) {
    return parsedAddress.address;
  }

  return `${firstLine}, ${parsedAddress.address}`;
}

export async function reverseGeocode(lat, lng, precision = 6) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return "-";
  }

  if (!GOONG_API_KEY) {
    const fallbackNoKey = `${Number(lat).toFixed(precision)}, ${Number(lng).toFixed(precision)}`;
    geocodeCache.set(
      `${Number(lat).toFixed(precision)},${Number(lng).toFixed(precision)}`,
      fallbackNoKey,
    );
    return fallbackNoKey;
  }

  const latNum = Number(lat);
  const lngNum = Number(lng);
  const cacheKey = `${latNum.toFixed(precision)},${lngNum.toFixed(precision)}`;

  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  try {
    const res = await requestWithRetry(() =>
      rateLimitedRequest(() =>
        axios.get(GOONG_GEOCODE_URL, {
          params: {
            latlng: `${latNum},${lngNum}`,
            api_key: GOONG_API_KEY,
          },
        }),
      ),
    );

    const firstResult = Array.isArray(res?.data?.results)
      ? res.data.results[0]
      : null;

    if (firstResult) {
      const parsed = parseGoongAddress(firstResult);
      const addressText = buildDetailedAddressText(parsed);
      if (addressText) {
        geocodeCache.set(cacheKey, addressText);
        return addressText;
      }
    }
  } catch {
    // Fallback to coordinates when geocoding API fails.
  }

  const fallback = `${latNum.toFixed(precision)}, ${lngNum.toFixed(precision)}`;
  geocodeCache.set(cacheKey, fallback);
  return fallback;
}

export async function searchAddress(query, limit = 5, options = {}) {
  const normalizedQuery = query?.trim();
  if (!normalizedQuery || normalizedQuery.length < 3) return [];
  if (!GOONG_API_KEY) return [];

  const cacheKey = `${normalizedQuery.toLowerCase()}::${limit}`;
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey);
  }

  try {
    const res = await requestWithRetry(() =>
      rateLimitedRequest(() =>
        axios.get(GOONG_AUTOCOMPLETE_URL, {
          signal: options.signal,
          params: {
            input: normalizedQuery,
            limit: limit,
            location: options.location || HCM_LOCATION,
            radius: options.radius || HCM_SEARCH_RADIUS,
            api_key: GOONG_API_KEY,
          },
        }),
      ),
    );

    const rawResults = Array.isArray(res?.data?.predictions)
      ? res.data.predictions
      : [];

    const results = rawResults
      .map((item) => ({
        address: item.description || "",
        main_text: item.structured_formatting?.main_text || "",
        secondary_text: item.structured_formatting?.secondary_text || "",
        place_id: item.place_id || "",
        reference: item.reference || "",
        lat: undefined,
        lng: undefined,
      }))
      .slice(0, Math.max(1, limit));

    searchCache.set(cacheKey, results);
    return results;
  } catch {
    return [];
  }
}

export async function getPlaceDetails(placeId) {
  if (!GOONG_API_KEY || !placeId) return null;

  try {
    const res = await requestWithRetry(() =>
      rateLimitedRequest(() =>
        axios.get("https://rsapi.goong.io/geocode", {
          params: {
            place_id: placeId,
            api_key: GOONG_API_KEY,
          },
        }),
      ),
    );

    const result = Array.isArray(res?.data?.results)
      ? res.data.results[0]
      : null;

    if (result) {
      const parsed = parseGoongAddress(result);
      return {
        lat: parsed.lat,
        lng: parsed.lng,
        address: parsed.address,
      };
    }
  } catch {
    return null;
  }
}
