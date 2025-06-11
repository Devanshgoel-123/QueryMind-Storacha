
import OpenAI from 'openai';
import { OPENAI_KEY } from './config';
const openai = new OpenAI({ apiKey: OPENAI_KEY });


export async function summarizeChunk(chunk: string): Promise<string> {
  const res = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a helpful assistant that summarizes text.' },
      { role: 'user',   content: `Summarize this in 1–2 sentences:\n\n${chunk}` },
    ],
    max_tokens: 150,
    temperature: 0.2,
  });

  const choice = res.choices?.[0];
  const content = choice?.message?.content;
  if (!content) {
    throw new Error('OpenAI summarizeChunk: no content returned');
  }
  return content.trim();
}


export async function getEmbedding(text: string): Promise<number[]> {
  const r = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });
  const embedding = r.data?.[0]?.embedding;
  if (!embedding) {
    throw new Error('OpenAI getEmbedding: no embedding returned');
  }
  return embedding;
}


export async function answerWithContext(
  contexts: string[],
  question: string
): Promise<string> {
  const prompt = `
Use the following context to answer the question:

${contexts.join('\n---\n')}

Question: ${question}
`;
  const res = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a helpful assistant that answers questions based on provided context.' },
      { role: 'user',   content: prompt },
    ],
    max_tokens: 300,
    temperature: 0.2,
  });

  const choice = res.choices?.[0];
  const content = choice?.message?.content;
  if (!content) {
    throw new Error('OpenAI answerWithContext: no content returned');
  }
  return content.trim();
}

export async function extractKeywords(question: string): Promise<string[]> {
  const prompt = `
You are a helpful assistant that extracts the most important keywords from a user question.
Return them as a JSON array of lowercase strings, with no extra explanation.

Question:
${question}
`;
  const res = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'Extract 3–5 keywords from the user question.' },
      { role: 'user',   content: prompt },
    ],
    temperature: 0.0,
    max_tokens: 60,
  });

  const text = res.choices?.[0]?.message?.content;
  if (!text) throw new Error('extractKeywords: no content returned');
  try {
    // parse the JSON array the model returned
    const arr = JSON.parse(text) as unknown;
    if (Array.isArray(arr) && arr.every(x => typeof x === 'string')) {
      return arr as string[];
    }
  } catch {
    // fallback: split on non-words
  }
  //  naive fallback
  return question
    .toLowerCase()
    .split(/\W+/)
    .filter(w => w.length > 3)
    .slice(0, 5);
}