import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return Response.json({ error: 'Text is required' }, { status: 400 });
    }

    const response = await groq.audio.speech.create({
      model: 'canopylabs/orpheus-v1-english',
      voice: 'troy',
      input: text,
      response_format: 'wav'
    });

    const buffer = Buffer.from(await response.arrayBuffer());

    return new Response(buffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('TTS Error:', error);
    return Response.json({ error: 'Failed to generate speech' }, { status: 500 });
  }
}
