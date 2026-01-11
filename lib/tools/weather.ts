import { tool } from 'ai';
import { z } from 'zod';

export const weatherTool = tool({
  description: 'Get current weather information for a city. Returns temperature, conditions, humidity, and wind speed that you can use to provide a natural language weather report to the user.',
  inputSchema: z.object({
    location: z.string().describe('The city or location to get weather for'),
    units: z.enum(['celsius', 'fahrenheit']).default('celsius').describe('Temperature units'),
  }),
  execute: async ({ location, units }) => {
    try {
      // Geocode the city to get coordinates
      const geocodeResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
      );

      if (!geocodeResponse.ok) {
        throw new Error('Geocoding service unavailable');
      }

      const geocodeData = await geocodeResponse.json();

      if (!geocodeData.results || geocodeData.results.length === 0) {
        throw new Error(`Location "${location}" not found`);
      }

      const { latitude, longitude, name } = geocodeData.results[0];

      // Get real weather data from Open-Meteo
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,windspeed_10m,weather_code&timezone=auto`
      );

      if (!weatherResponse.ok) {
        throw new Error('Weather service unavailable');
      }

      const weatherData = await weatherResponse.json();

      const temperature_c = weatherData.current.temperature_2m;
      const temperature_f = (temperature_c * 9/5) + 32;
      const temperature = units === 'celsius' ? temperature_c : temperature_f;
      const humidity = weatherData.current.relative_humidity_2m;
      const windSpeed_kmh = weatherData.current.windspeed_10m;
      const windSpeed_mph = windSpeed_kmh * 0.621371;
      const windSpeed = units === 'celsius' ? windSpeed_kmh : windSpeed_mph;
      const weatherCode = weatherData.current.weather_code;

      // Map weather codes to descriptions
      const weatherDescriptions: { [key: number]: string } = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        56: 'Light freezing drizzle',
        57: 'Dense freezing drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        66: 'Light freezing rain',
        67: 'Heavy freezing rain',
        71: 'Slight snow fall',
        73: 'Moderate snow fall',
        75: 'Heavy snow fall',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with slight hail',
        99: 'Thunderstorm with heavy hail'
      };

      const conditions = weatherDescriptions[weatherCode] || 'Unknown conditions';

      return {
        location: name,
        temperature: `${Math.round(temperature)}°${units === 'celsius' ? 'C' : 'F'}`,
        conditions,
        humidity: `${humidity}%`,
        windSpeed: `${Math.round(windSpeed)} ${units === 'celsius' ? 'km/h' : 'mph'}`,
        lastUpdated: new Date().toLocaleString(),
      };
    } catch (error) {
      console.error('Weather tool error:', error);
      throw new Error(`Failed to get weather for ${location}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
