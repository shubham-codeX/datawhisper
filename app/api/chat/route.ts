import { db } from '@/db/db';
import { openai } from '@ai-sdk/openai';
import { streamText, UIMessage, convertToModelMessages , tool, stepCountIs} from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const SYSTEM_PROMPT = `You are an expert SQL assistant. You help users by generating SQL queries based on their requests. Always ensure that the SQL queries you generate are syntactically correct and optimized for performance. If a user's request is ambiguous, ask clarifying questions before providing a SQL query.
  ${new Date().toLocaleString('sv-SE')}
  you have access to following tools:
  1. DB tool - call this tool to execute the sql queries on the database and get the results.
  2. schema tool - call this tool to get the database schema which will help you to write sql query.
  
  Rules:
  - Generate ONLY SELECT Queries(no INSERT, UPDATE, DELETE, CREATE, DROP, ALTER)
  - Always use the schema provided by schema tool.
  - Pass in valid SQL syntax in db tool.
  - IMPORTANT: To query database call db tool, don't return just dql query as response.
  
  Always respond in helpful, conversational tone while being technically accurate.
  `;

  const result = streamText({
    model: openai('gpt-5-nano'),
    messages: convertToModelMessages(messages),
    system: SYSTEM_PROMPT,
    stopWhen: stepCountIs(5),
    tools: {
      schema: tool({
        description: 'call this tool to get the database schema informaion.',
        inputSchema: z.object({}),
        execute: async ({}) => {
          return `CREATE TABLE products (
                  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	                name text NOT NULL,
	                category text NOT NULL,
	                price real NOT NULL,
	                stock integer NOT NULL,
	                created_at text DEFAULT CURRENT_TIMESTAMP
                  );
                CREATE TABLE sales (
	                id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	                product_id integer NOT NULL,
	                quantity integer NOT NULL,
	                total_amount real NOT NULL,
	                sale_date text DEFAULT CURRENT_TIMESTAMP,
	                customer_name text NOT NULL,
	                region text NOT NULL,
	                FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE no action ON DELETE no action
                  )`;
        },
      }),

      db: tool({
        description: 'Call this tool to query a database.',
        inputSchema: z.object({
          query: z.string().describe('The SQL query to execute on the database.'),
        }),
        execute: async ({ query }) => {
          console.log('Executing database query:', query);
          //IMPORTANT! : make sure to only run safe queries (SELECT statements)
          return await db.run(query);
          // return query;
        },
      }),

    },
  });

  return result.toUIMessageStreamResponse();
}