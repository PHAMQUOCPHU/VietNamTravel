/**
 * OpenWeather APIs are external; keep them isolated from backend services.
 * Uses fetch to avoid coupling to axios in UI code.
 */

export async function fetchOpenWeatherGeo({ q, limit = 5, apiKey, signal }) {
  const url =
    "https://api.openweathermap.org/geo/1.0/direct" +
    `?q=${encodeURIComponent(q)}` +
    `&limit=${encodeURIComponent(String(limit))}` +
    `&appid=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`OpenWeather geo failed (${res.status})`);
  return res.json();
}

export async function fetchOpenWeatherForecast({
  lat,
  lon,
  apiKey,
  units = "metric",
  lang = "vi",
  signal,
}) {
  const url =
    "https://api.openweathermap.org/data/2.5/forecast" +
    `?lat=${encodeURIComponent(String(lat))}` +
    `&lon=${encodeURIComponent(String(lon))}` +
    `&units=${encodeURIComponent(units)}` +
    `&lang=${encodeURIComponent(lang)}` +
    `&appid=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`OpenWeather forecast failed (${res.status})`);
  return res.json();
}

