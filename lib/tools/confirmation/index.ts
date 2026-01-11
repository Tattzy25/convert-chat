import { z } from 'zod';

export const confirmationTool = {
  description: 'Ask the user for confirmation before proceeding.',
  inputSchema: z.object({
    message: z.string().describe('Prompt shown to the user'),
  }),
};
