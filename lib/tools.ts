import { weatherTool } from './tools/weather';

export const tools = {
  getWeatherInformation: weatherTool,
};

// Export individual tools for reference
export { weatherTool } from './tools/weather';
export { locationTool } from './tools/location/index';
export { confirmationTool } from './tools/confirmation/index';
