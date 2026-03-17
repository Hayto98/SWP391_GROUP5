import axios from "axios";

const geocodeCache = new Map();
const searchCache = new Map();

const NOMINATIM_MIN_INTERVAL_MS = 1000;
const MAX_429_RETRIES = 2;

let lastRequestTime = 0;
let requestQueue = Promise.resolve();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function rateLimitedRequest(fn) {
  const run = async () => {
    const now = Date.now();
    const diff = now - lastRequestTime;

    if (diff < NOMINATIM_MIN_INTERVAL_MS) {
      await sleep(NOMINATIM_MIN_INTERVAL_MS - diff);
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
    const res = await requestWithRetry(() =>
      rateLimitedRequest(() =>
        axios.get("https://nominatim.openstreetmap.org/reverse", {
          params: {
            format: "json",
            lat: latNum,
            lon: lngNum,
            "accept-language": "vi",
            addressdetails: 1,
            zoom: 18,
          },
          headers: {
            Accept: "application/json",
            "Accept-Language": "vi",
          },
        }),
      ),
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

export async function searchAddress(query, limit = 5, options = {}) {
  const normalizedQuery = query?.trim();
  if (!normalizedQuery || normalizedQuery.length < 3) return [];

  const cacheKey = `${normalizedQuery.toLowerCase()}::${limit}`;
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey);
  }

  try {
    const res = await requestWithRetry(() =>
      rateLimitedRequest(() =>
        axios.get("https://nominatim.openstreetmap.org/search", {
          signal: options.signal,
          params: {
            q: normalizedQuery,
            format: "json",
            limit,
            "accept-language": "vi",
            countrycodes: "vn",
            viewbox: "106.35,11.16,107.03,10.35",
            bounded: 1,
            addressdetails: 1,
          },
          headers: {
            Accept: "application/json",
            "Accept-Language": "vi",
          },
        }),
      ),
    );

    const results = (Array.isArray(res.data) ? res.data : []).map((item) => {
      const addr = item?.address || {};

      return {
        address: item?.display_name || "",
        houseNumber: addr.house_number || "",
        road: addr.road || "",
        suburb: addr.suburb || addr.neighbourhood || "",
        district: addr.district || addr.county || "",
        city: addr.city || addr.state || "",
        lat: Number(item?.lat),
        lng: Number(item?.lon),
      };
    });

    searchCache.set(cacheKey, results);
    return results;
  } catch {
    return [];
  }
}
