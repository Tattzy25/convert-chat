export interface Model {
  name: string;
  value: string;
  provider: string;
  capabilities: string[];
}

export const models: Model[] = [
  {
    name: 'GPT 4o',
    value: 'openai/gpt-4o',
    provider: 'openai',
    capabilities: ['vision', 'reasoning', 'chain-of-thought', 'tool-calling'],
  },
  {
    name: 'Deepseek R1',
    value: 'deepseek/deepseek-r1',
    provider: 'deepseek',
    capabilities: ['reasoning', 'chain-of-thought'],
  },
  {
    name: 'OpenAI GPT-OSS-120B',
    value: 'openai/gpt-oss-120b',
    provider: 'openai',
    capabilities: ['text', 'reasoning', 'chain-of-thought', 'tool-calling'],
  },
  {
    name: 'Meta Llama 4 Scout',
    value: 'meta/llama-4-scout',
    provider: 'meta',
    capabilities: ['vision', 'reasoning', 'chain-of-thought', 'tool-calling'],
  },
  {
    name: 'Vercel V0-1.5-MD',
    value: 'vercel/v0-1.5-md',
    provider: 'vercel',
    capabilities: ['reasoning', 'chain-of-thought', 'coding'],
  },
  {
    name: 'xAI Grok-2 Vision',
    value: 'xai/grok-2-vision',
    provider: 'xai',
    capabilities: ['vision', 'reasoning', 'chain-of-thought'],
  },
  {
    name: 'xAI Grok-4.1 Fast Reasoning',
    value: 'xai/grok-4.1-fast-reasoning',
    provider: 'xai',
    capabilities: ['reasoning', 'chain-of-thought', 'fast'],
  },
  {
    name: 'OpenAI GPT-5.2',
    value: 'openai/gpt-5.2',
    provider: 'openai',
    capabilities: ['vision', 'reasoning', 'chain-of-thought', 'tool-calling'],
  },
  {
    name: 'Google Imagen 4.0',
    value: 'google/imagen-4.0-generate-001',
    provider: 'google',
    capabilities: ['image-generation'],
  },

];
