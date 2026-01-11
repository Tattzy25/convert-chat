import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { tools } from '@/lib/tools';

// Allow streaming responses up to 5 minutes for longer conversations
export const maxDuration = 500;

async function parseRequest(req: Request) {
  let messages: UIMessage[];
  let model: string;
  let webSearch: boolean;

  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    const messagesStr = formData.get('messages') as string;
    messages = JSON.parse(messagesStr);
    model = formData.get('model') as string;
    webSearch = formData.get('webSearch') === 'true';

    // Process uploaded files
    const files = formData.getAll('files') as File[];
    if (files.length > 0) {
      await processUploadedFiles(messages, files);
    }
  } else {
    const body = await req.json();
    messages = body.messages;
    model = body.model;
    webSearch = body.webSearch;
  }

  return { messages, model, webSearch };
}

async function processUploadedFiles(messages: UIMessage[], files: File[]) {
  let additionalText = '';

  // Append to the last user message
  const lastMessage = messages.at(-1);
  if (lastMessage?.role === 'user') {
    // Process text files
    for (const file of files) {
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const content = await file.text();
        additionalText += `\n\n--- Content of ${file.name} ---\n${content}\n--- End of ${file.name} ---\n`;
      }
    }

    if (additionalText) {
      lastMessage.parts.push({ type: 'text', text: additionalText });
    }

    // Process image files
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;
        (lastMessage.parts as any[]).push({ type: 'image', image: dataUrl });
      }
    }

    // Remove file parts since we've processed them
    lastMessage.parts = lastMessage.parts.filter(part => part.type !== 'file');
  }
}

export async function POST(req: Request) {
  const { messages, model, webSearch } = await parseRequest(req);

  const result = streamText({
    model: webSearch ? 'perplexity/sonar' : model,
    messages: await convertToModelMessages(messages),
    tools,
    system: 'You are a helpful assistant that can answer questions and help with tasks. When you use tools, always provide a clear, natural language response to the user based on the tool results. Do not just call tools without explaining the results.',
  });

  // send sources and reasoning back to the client
  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
  });
}
