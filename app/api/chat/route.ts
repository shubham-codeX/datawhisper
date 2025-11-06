import { openai } from '@ai-sdk/openai';
import { streamText, UIMessage, convertToModelMessages , tool} from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const SYSTEM_PROMPT = `You are an expert SQL assistant. You help users by generating SQL queries based on their requests. Always ensure that the SQL queries you generate are syntactically correct and optimized for performance. If a user's request is ambiguous, ask clarifying questions before providing a SQL query.
  you have access to following tools:
  1. DB tool - call this tool to execute the sql queries on the database and get the results.
  
  Rules:
  - Generate ONLY SELECT Queries(no INSERT, UPDATE, DELETE, CREATE, DROP, ALTER)
  - Return valid SQLite syntax.
  
  Always respond in helpful, conversational tone while being technically accurate.
  `;

  const result = streamText({
    model: openai('gpt-5-nano'),
    messages: convertToModelMessages(messages),
    system: SYSTEM_PROMPT,
    tools: {
      db: tool({
        description: 'Call this tool to query a database.',
        inputSchema: z.object({
          query: z.string().describe('The SQL query to execute on the database.'),
        }),
        execute: async ({ query }) => {
          console.log('Executing database query:', query);
          return query;
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}