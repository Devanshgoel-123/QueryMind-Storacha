import dotenv from 'dotenv';
dotenv.config();

export const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
export const OPENAI_KEY     = process.env.OPENAI_API_KEY!;
export const MCP_REST_URL   = process.env.MCP_REST_URL!;
export const DELEGATION     = process.env.DELEGATION!;

export const CHROMA_HOST       = '127.0.0.1';
export const CHROMA_PORT       = 8000;
export const CHROMA_COLLECTION = 'rag_chunks';
export const TOP_K             = 5;
export const CHUNK_SIZE     = 10000;   

