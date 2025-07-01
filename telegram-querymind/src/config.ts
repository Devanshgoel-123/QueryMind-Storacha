import dotenv from 'dotenv';
dotenv.config();

export const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
export const OPENAI_KEY     = process.env.OPENAI_API_KEY!;
export const MCP_REST_URL   = process.env.MCP_REST_URL!;
export const DELEGATION     = process.env.DELEGATION!;

export const CHROMA_API_KEY = process.env.CHROMA_API_KEY;        
export const CHROMA_TENANT = process.env.CHROMA_TENANT ;      
export const CHROMA_DATABASE = 'Query';      
export const CHROMA_COLLECTION = 'querymind_chunks'; 
export const TOP_K = 5;


export const CHUNK_SIZE     = 25000;   

