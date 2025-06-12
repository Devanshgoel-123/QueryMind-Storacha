import { CHUNK_SIZE } from './config';
import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';


export function chunkText(text: string): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
}


export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text;
}


export function writeTempFile(buffer: Buffer, ext = '.pdf'): string {
  const filename = path.join(__dirname, '..', 'tmp', `${Date.now()}${ext}`);
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, buffer);
  return filename;
}