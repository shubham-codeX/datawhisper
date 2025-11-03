import { openai } from '@ai-sdk/openai';
import { streamText, UIMessage, convertToModelMessages } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 5;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = streamText({
    model: openai('gpt-5-nano'),
    messages: convertToModelMessages(messages),
  });
  console.log("Messages received at API route:", result.toUIMessageStreamResponse() );

  return result.toUIMessageStreamResponse();
}