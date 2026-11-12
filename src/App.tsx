import React, { useMemo, useState } from 'react';

type GeoResult = {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
};

type WeatherData = {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  daily: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
  };
};

const weatherDescriptions: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Light rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  95: 'Thunderstorm',
};

function App() {
  const [query, setQuery] = useState('London');
  const [city, setCity] = useState('London');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
      );
      const geoData = await geoResponse.json();
      const location = geoData.results?.[0] as GeoResult | undefined;

      if (!location) {
        throw new Error('City not found');
      }

      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`
      );
      const weatherData = await weatherResponse.json();

      setCity(location.name);
      setWeather(weatherData as WeatherData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load weather');
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const forecast = useMemo(() => {
    if (!weather) {
      return [];
    }

    return weather.daily.temperature_2m_max.map((_, index) => ({
      max: weather.daily.temperature_2m_max[index],
      min: weather.daily.temperature_2m_min[index],
      code: weather.daily.weather_code[index],
    }));
  }, [weather]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-800 to-sky-700 p-4 text-slate-50 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col rounded-[28px] border border-white/15 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur-xl sm:p-8">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">Weather dashboard</p>
            <h1 className="text-2xl font-semibold sm:text-3xl">Check the weather anywhere</h1>
          </div>
          <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleSearch}>
            <input
              aria-label="City search"
              className="w-full rounded-full border border-slate-600 bg-slate-800/80 px-4 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-400 focus:border-sky-400 sm:min-w-[240px]"
              placeholder="Search for a city"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button
              className="rounded-full bg-sky-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-sky-300"
              type="submit"
            >
              Search
            </button>
          </form>
        </header>

        {loading && <p className="py-2 text-slate-300">Loading weather…</p>}
        {error && <p className="py-2 text-rose-300">{error}</p>}

        {weather && !error && (
          <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl bg-white/10 p-6">
              <p className="text-lg font-semibold">{city}</p>
              <p className="mt-2 text-5xl font-semibold">{weather.current.temperature_2m}°C</p>
              <p className="mt-2 text-sky-200">{weatherDescriptions[weather.current.weather_code] ?? 'Weather update'}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <div className="rounded-xl bg-white/10 px-3 py-3">
                  <span className="block text-sm text-slate-300">Humidity</span>
                  <strong className="text-lg">{weather.current.relative_humidity_2m}%</strong>
                </div>
                <div className="rounded-xl bg-white/10 px-3 py-3">
                  <span className="block text-sm text-slate-300">Wind</span>
                  <strong className="text-lg">{weather.current.wind_speed_10m} km/h</strong>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 p-6">
              <h2 className="text-xl font-semibold">3-day outlook</h2>
              <div className="mt-4 space-y-3">
                {forecast.map((day, index) => (
                  <div className="rounded-xl bg-slate-800/70 p-3" key={`${day.max}-${index}`}>
                    <div className="flex items-center justify-between text-sm text-slate-300">
                      <span>Day {index + 1}</span>
                      <span>{weatherDescriptions[day.code] ?? 'Forecast'}</span>
                    </div>
                    <p className="mt-2 font-semibold">
                      {day.max}° / {day.min}°
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
