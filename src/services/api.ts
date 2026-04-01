import { format, subDays, addDays } from "date-fns";

const BASE_URL_FORECAST = "https://api.open-meteo.com/v1/forecast";
const BASE_URL_ARCHIVE = "https://archive-api.open-meteo.com/v1/archive";
const BASE_URL_AQI = "https://air-quality-api.open-meteo.com/v1/air-quality";

export interface Location {
  lat: number;
  lon: number;
}

export const fetchCurrentWeather = async (loc: Location, date: Date) => {
  const dateStr = format(date, "yyyy-MM-dd");
  const isArchive = date < subDays(new Date(), 90);
  const baseUrl = isArchive ? BASE_URL_ARCHIVE : BASE_URL_FORECAST;

  const params = new URLSearchParams({
    latitude: loc.lat.toString(),
    longitude: loc.lon.toString(),
    start_date: dateStr,
    end_date: dateStr,
    daily: [
      "temperature_2m_max",
      "temperature_2m_min",
      "sunrise",
      "sunset",
      "uv_index_max",
      "precipitation_probability_max",
      "wind_speed_10m_max",
      "precipitation_sum",
    ].join(","),
    hourly: [
      "temperature_2m",
      "relative_humidity_2m",
      "precipitation",
      "visibility",
      "wind_speed_10m",
    ].join(","),
    timezone: "auto",
  });

  if (!isArchive) {
    params.append(
      "current",
      ["temperature_2m", "precipitation", "wind_speed_10m", "relative_humidity_2m"].join(",")
    );
  }

  const res = await fetch(`${baseUrl}?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch weather data");
  return res.json();
};

export const fetchCurrentAQI = async (loc: Location, date: Date) => {
  const dateStr = format(date, "yyyy-MM-dd");
  const params = new URLSearchParams({
    latitude: loc.lat.toString(),
    longitude: loc.lon.toString(),
    start_date: dateStr,
    end_date: dateStr,
    hourly: [
      "pm10",
      "pm2_5",
      "carbon_monoxide",
      "nitrogen_dioxide",
      "sulphur_dioxide",
      "european_aqi",
    ].join(","),
    timezone: "auto",
  });

  try {
    const res = await fetch(`${BASE_URL_AQI}?${params.toString()}`);
    if (!res.ok) {
      console.warn("AQI data fetch failed, returning empty data");
      return { hourly: {} };
    }
    return await res.json();
  } catch (err) {
    console.warn("AQI data fetch failed, returning empty data", err);
    return { hourly: {} };
  }
};

export const fetchHistoricalWeather = async (loc: Location, startDate: Date, endDate: Date) => {
  const startStr = format(startDate, "yyyy-MM-dd");
  const endStr = format(endDate, "yyyy-MM-dd");

  const params = new URLSearchParams({
    latitude: loc.lat.toString(),
    longitude: loc.lon.toString(),
    start_date: startStr,
    end_date: endStr,
    daily: [
      "temperature_2m_mean",
      "temperature_2m_max",
      "temperature_2m_min",
      "sunrise",
      "sunset",
      "precipitation_sum",
      "wind_speed_10m_max",
      "wind_direction_10m_dominant",
    ].join(","),
    timezone: "auto",
  });

  const res = await fetch(`${BASE_URL_ARCHIVE}?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch historical weather data");
  return res.json();
};

export const fetchHistoricalAQI = async (loc: Location, startDate: Date, endDate: Date) => {
  const startStr = format(startDate, "yyyy-MM-dd");
  const endStr = format(endDate, "yyyy-MM-dd");

  const params = new URLSearchParams({
    latitude: loc.lat.toString(),
    longitude: loc.lon.toString(),
    start_date: startStr,
    end_date: endStr,
    hourly: ["pm10", "pm2_5"].join(","),
    timezone: "auto",
  });

  try {
    const res = await fetch(`${BASE_URL_AQI}?${params.toString()}`);
    if (!res.ok) {
      console.warn("Historical AQI data fetch failed, returning empty data");
      return { hourly: {} };
    }
    return await res.json();
  } catch (err) {
    console.warn("Historical AQI data fetch failed, returning empty data", err);
    return { hourly: {} };
  }
};
