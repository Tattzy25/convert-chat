import { z } from 'zod';

interface WeatherData {
  location: string;
  timezone: string;
  currentTime: string;
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    description: string;
    wind_speed: number;
    wind_deg: number;
    visibility: number;
    uvi: number;
  };
  units: 'metric' | 'imperial';
  rawData?: any;
}

export const weatherTool = {
  description: 'Get current weather data for a specific location using latitude and longitude coordinates.',
  inputSchema: z.object({
    lat: z.number().min(-90).max(90).describe('Latitude coordinate (-90 to 90)'),
    lon: z.number().min(-180).max(180).describe('Longitude coordinate (-180 to 180)'),
    locationName: z.string().optional().describe('Optional location name for display purposes'),
    units: z.enum(['standard', 'metric', 'imperial']).optional().default('imperial').describe('Units of measurement'),
    exclude: z.string().optional().describe('Comma-delimited list of parts to exclude (current,minutely,hourly,daily,alerts)'),
  }),
  execute: async ({
    lat,
    lon,
    locationName,
    units = 'imperial',
    exclude
  }: {
    lat: number;
    lon: number;
    locationName?: string;
    units?: string;
    exclude?: string
  }): Promise<WeatherData> => {
    const apiKey = process.env.OPEN_WEATHER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenWeatherMap API key not configured');
    }

    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      appid: apiKey,
      units,
    });

    if (exclude) {
      params.append('exclude', exclude);
    }

    const url = `https://api.openweathermap.org/data/3.0/onecall?${params.toString()}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Process and format the weather data
      const currentTime = new Date((data.current.dt + data.timezone_offset) * 1000);
      const timezoneName = data.timezone.replace('_', ' ');

      const weatherData: WeatherData = {
        location: locationName || `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        timezone: timezoneName,
        currentTime: currentTime.toLocaleString('en-US', {
          timeZone: 'UTC',
          hour12: true,
          hour: 'numeric',
          minute: '2-digit',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        current: {
          temp: data.current.temp,
          feels_like: data.current.feels_like,
          humidity: data.current.humidity,
          description: data.current.weather?.[0]?.description || 'Unknown',
          wind_speed: data.current.wind_speed,
          wind_deg: data.current.wind_deg,
          visibility: data.current.visibility,
          uvi: data.current.uvi,
        },
        units: units as 'metric' | 'imperial',
        rawData: data, // Include raw data for collapsible details
      };

      return weatherData;
    } catch (error) {
      throw new Error(`Failed to fetch weather data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};
