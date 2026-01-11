'use client';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { useCallback, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { CopyIcon, GlobeIcon, RefreshCcwIcon, EyeIcon, BrainIcon, ZapIcon, DownloadIcon, ShareIcon, Volume2Icon, GitBranchIcon, ImageIcon, WrenchIcon } from 'lucide-react';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/sources';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import {
  Confirmation,
  ConfirmationTitle,
  ConfirmationRequest,
  ConfirmationAccepted,
  ConfirmationRejected,
  ConfirmationActions,
  ConfirmationAction,
} from '@/components/ai-elements/confirmation';
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/lib/tool';
import { Weather } from '@/components/ai-elements/weather';
import { Loader } from '@/components/ai-elements/loader';
import { Image as AIGeneratedImage } from '@/components/ai-elements/image';
import { models } from '@/lib/models';

const getCapabilityIcon = (capability: string) => {
  switch (capability) {
    case 'vision':
      return <EyeIcon className="inline size-3 ml-1 opacity-60" />;
    case 'reasoning':
      return <BrainIcon className="inline size-3 ml-1 opacity-60" />;
    case 'chain-of-thought':
      return <GitBranchIcon className="inline size-3 ml-1 opacity-60" />;
    case 'fast':
      return <ZapIcon className="inline size-3 ml-1 opacity-60" />;
    case 'image-generation':
      return <ImageIcon className="inline size-3 ml-1 opacity-60" />;
    case 'tool-calling':
      return <WrenchIcon className="inline size-3 ml-1 opacity-60" />;
    case 'coding':
      return <GitBranchIcon className="inline size-3 ml-1 opacity-60" />;
    default:
      return null;
  }
};

const getMessageTextContent = (parts: any[]) => {
  return parts
    .filter(part => part.type === 'text')
    .map(part => part.text)
    .join('\n');
};

const handleCopyMessage = (parts: any[]) => {
  const textContent = getMessageTextContent(parts);
  navigator.clipboard.writeText(textContent);
};

const handleDownloadMessage = (parts: any[], messageId: string) => {
  const textContent = getMessageTextContent(parts);
  const blob = new Blob([textContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `message-${messageId}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const handleShareMessage = (parts: any[]) => {
  const textContent = getMessageTextContent(parts);
  if (navigator.share) {
    navigator.share({
      title: 'AI Chat Message',
      text: textContent,
    });
  } else {
    navigator.clipboard.writeText(textContent);
  }
};

const handleReadAloudMessage = async (parts: any[]) => {
  const textContent = getMessageTextContent(parts);

  // Limit text to 200 characters as per Groq API limits
  const limitedText = textContent.length > 200 ? textContent.substring(0, 200) : textContent;

  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: limitedText }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TTS API Error:', response.status, errorText);
      throw new Error(`TTS request failed: ${response.status} ${response.statusText}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();

    // Clean up the object URL after playing
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
    };
  } catch (error) {
    console.error('Read aloud error:', error);
    // Show user-friendly error message
    alert('Text-to-speech failed. Please check that groq-sdk is installed and GROQ_API_KEY is set.');
  }
};

const ChatBot = () => {
  const [model, setModel] = useState<string>(models[0].value);
  const [webSearch, setWebSearch] = useState(false);
  const { messages, sendMessage, status, regenerate, error } = useChat({
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const handleSubmit = useCallback(async (message: PromptInputMessage) => {
    let processedText = message.text || '';

    const hasFiles = message.files?.length > 0;

    if (hasFiles) {
      for (const file of message.files) {
        if (file.mediaType === 'text/plain') {
          try {
            const response = await fetch(file.url);
            const content = await response.text();
            processedText += `\n\n--- Content of ${file.filename || 'file'} ---\n${content}\n--- End of ${file.filename || 'file'} ---\n`;
          } catch (error) {
            console.error('Error reading text file:', error);
          }
        }
      }
    }

    const hasText = Boolean(processedText.trim());
    const hasImageFiles = hasFiles && message.files.some(f => f.mediaType?.startsWith('image/'));
    if (!hasText && !hasImageFiles) {
      return;
    }

    // Construct message parts
    const parts: any[] = [];
    if (hasText) {
      parts.push({ type: 'text', text: processedText });
    }
    if (hasImageFiles) {
      for (const file of message.files) {
        if (file.mediaType?.startsWith('image/')) {
          parts.push({ type: 'image', image: file.url });
        }
      }
    }

    // Check if this is an image generation request
    const isImageRequest = /\b(create|generate|make|draw|design|illustrate|picture|image|photo)\b/i.test(processedText);

    if (isImageRequest) {
      setIsGeneratingImage(true);
    }

    try {
      await sendMessage(
        {
          parts
        },
        {
          body: {
            model: model,
            webSearch: webSearch,
          },
        },
      );
    } finally {
      setIsGeneratingImage(false);
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full h-screen" aria-hidden="false">
      <div className="flex flex-col h-full">
        <Conversation className="h-full">
          <ConversationContent>
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === 'assistant' && message.parts.some((part) => part.type === 'source-url') && (
                  <Sources>
                    <SourcesTrigger
                      count={
                        message.parts.filter(
                          (part) => part.type === 'source-url',
                        ).length
                      }
                    />
                    {message.parts.filter((part) => part.type === 'source-url').map((part, i) => (
                      <SourcesContent key={`${message.id}-${i}`}>
                        <Source
                          key={`${message.id}-${i}`}
                          href={part.url}
                          title={part.url}
                        />
                      </SourcesContent>
                    ))}
                  </Sources>
                )}
                {message.parts.map((part, i) => {
                  if (part.type === 'text') {
                    return (
                      <Message key={`${message.id}-${i}`} from={message.role}>
                        <MessageContent>
                          <MessageResponse>
                            {part.text}
                          </MessageResponse>
                        </MessageContent>
                        {message.role === 'assistant' && (
                          <div className="flex justify-start mt-2">
                            <MessageActions>
                              <MessageAction
                                onClick={() => handleCopyMessage(message.parts)}
                                label="Copy"
                              >
                                <CopyIcon className="size-3" />
                              </MessageAction>
                              <MessageAction
                                onClick={() => handleDownloadMessage(message.parts, message.id)}
                                label="Download"
                              >
                                <DownloadIcon className="size-3" />
                              </MessageAction>
                              <MessageAction
                                onClick={() => handleShareMessage(message.parts)}
                                label="Share"
                              >
                                <ShareIcon className="size-3" />
                              </MessageAction>
                              <MessageAction
                                onClick={() => handleReadAloudMessage(message.parts)}
                                label="Read Aloud"
                              >
                                <Volume2Icon className="size-3" />
                              </MessageAction>
                              {message.id === messages.at(-1)?.id && (
                                <MessageAction
                                  onClick={() => regenerate()}
                                  label="Retry"
                                >
                                  <RefreshCcwIcon className="size-3" />
                                </MessageAction>
                              )}
                            </MessageActions>
                          </div>
                        )}
                      </Message>
                    );
                  } else if (part.type === 'reasoning') {
                    return (
                      <Reasoning
                        key={`${message.id}-${i}`}
                        className="w-full"
                        isStreaming={status === 'streaming' && i === message.parts.length - 1 && message.id === messages.at(-1)?.id}
                      >
                        <ReasoningTrigger />
                        <ReasoningContent>{part.text}</ReasoningContent>
                      </Reasoning>
                    );
                  } else if (part.type === 'file' && part.mediaType?.startsWith('image/')) {
                    return (
                      <div key={`${message.id}-${i}`} className="my-4">
                        <img
                          src={part.url}
                          alt={part.filename || 'Uploaded image'}
                          className="max-w-full h-auto rounded-md"
                        />
                      </div>
                    );
                  } else if ((part as any).type === 'image') {
                    return (
                      <div key={`${message.id}-${i}`} className="my-4">
                        <img
                          src={(part as any).image}
                          alt="Uploaded image"
                          className="max-w-full h-auto rounded-md"
                        />
                      </div>
                    );
                  } else if (part.type.startsWith('tool-')) {
                    const toolPart = part as any; // Cast to access tool properties

                    // Check if this is weather data that should be displayed with the Weather component
                    const isWeatherTool = part.type === 'tool-getWeather';
                    const hasWeatherData = toolPart.output &&
                      typeof toolPart.output === 'object' &&
                      toolPart.output.location &&
                      toolPart.output.current &&
                      toolPart.output.units;

                    let toolContent;

                    if (isWeatherTool && hasWeatherData && toolPart.state === 'output-available') {
                      toolContent = (
                        <div className="my-4">
                          <Weather data={toolPart.output} />
                        </div>
                      );
                    } else if (toolPart.type === 'tool-generateImage' && toolPart.state === 'output-available' && toolPart.output && !toolPart.output.error) {
                      toolContent = (
                        <div key={`${message.id}-${i}`} className="my-4">
                          <AIGeneratedImage
                            {...toolPart.output}
                            alt="Generated image"
                            className="max-w-full h-auto"
                          />
                        </div>
                      );
                    } else {
                      toolContent = (
                        <Tool defaultOpen={toolPart.state === 'output-available' || toolPart.state === 'output-error'}>
                          <ToolHeader type={toolPart.type} state={toolPart.state} />
                          <ToolContent>
                            <ToolInput input={toolPart.input} />
                            <ToolOutput output={toolPart.output} errorText={toolPart.errorText} />
                          </ToolContent>
                        </Tool>
                      );
                    }

                    return (
                      <div key={`${message.id}-${i}`}>
                        {toolPart.approval && (
                          <Confirmation approval={toolPart.approval} state={toolPart.state}>
                            <ConfirmationTitle>
                              Tool requires approval: {part.type.split('-').slice(1).join('-')}
                            </ConfirmationTitle>
                            <ConfirmationRequest>
                              <ConfirmationActions>
                                <ConfirmationAction>Approve</ConfirmationAction>
                                <ConfirmationAction variant="destructive">Reject</ConfirmationAction>
                              </ConfirmationActions>
                            </ConfirmationRequest>
                            <ConfirmationAccepted>Tool approved and executed.</ConfirmationAccepted>
                            <ConfirmationRejected>Tool rejected.</ConfirmationRejected>
                          </Confirmation>
                        )}
                        {toolContent}
                      </div>
                    );
                  } else {
                    return null;
                  }
                })}
              </div>
            ))}
            {status === 'submitted' && <Loader />}
            {isGeneratingImage && (
              <div className="flex items-center justify-center p-8">
                <div className="flex items-center space-x-2">
                  <Loader />
                  <span className="text-muted-foreground">Generating image...</span>
                </div>
              </div>
            )}
            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-md">
                <p className="font-medium">Chat Error</p>
                <p className="text-sm">{error.message || 'An error occurred during the conversation.'}</p>
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <PromptInput onSubmit={handleSubmit} className="mt-4" globalDrop multiple>
          <PromptInputHeader>
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
          </PromptInputHeader>
          <PromptInputBody>
            <PromptInputTextarea />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
              <PromptInputButton
                variant={webSearch ? 'default' : 'ghost'}
                onClick={() => setWebSearch(!webSearch)}
              >
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>
              <PromptInputSelect
                onValueChange={(value) => {
                  setModel(value);
                }}
                value={model}
              >
                <PromptInputSelectTrigger>
                  <PromptInputSelectValue placeholder="Select model">
                    {models.find((m) => m.value === model)?.name || 'Select model'}
                  </PromptInputSelectValue>
                </PromptInputSelectTrigger>
                <PromptInputSelectContent>
                  {models.map((model) => (
                    <PromptInputSelectItem key={model.value} value={model.value}>
                      <span>
                        {model.name}
                        {model.capabilities.map((capability, index) => (
                          <span key={capability}>{getCapabilityIcon(capability)}</span>
                        ))}
                      </span>
                    </PromptInputSelectItem>
                  ))}
                </PromptInputSelectContent>
              </PromptInputSelect>
            </PromptInputTools>
            <PromptInputSubmit disabled={status !== 'ready'} status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
};

export default ChatBot;
