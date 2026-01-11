// Import tools
import { weatherTool } from './tools/weather/index';
import { z } from 'zod';

export const generateImageTool = {
  description: 'Generate an image based on a text description',
  inputSchema: z.object({
    prompt: z.string().describe('The text description of the image to generate'),
  }),
  execute: async ({ prompt }: { prompt: string }) => {
    try {
      // Call the image generation API
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Image generation failed');
      }

      const imageData = await response.json();
      return imageData;
    } catch (error) {
      return { error: 'Failed to generate image' };
    }
  },
};

export const tools = {
  getWeather: weatherTool,
  generateImage: generateImageTool,
};

// Export individual tools for reference
export { weatherTool } from './tools/weather/index';
