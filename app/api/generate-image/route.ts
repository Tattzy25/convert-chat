import { generateImage } from 'ai';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const result = await generateImage({
      model: 'google/imagen-4.0-generate-001',
      prompt: prompt,
    });

    // Return the complete Experimental_GeneratedImage object
    return Response.json(result.images[0]);
  } catch (error) {
    console.error('Image generation error:', error);
    return Response.json({ error: 'Failed to generate image' }, { status: 500 });
  }
}
