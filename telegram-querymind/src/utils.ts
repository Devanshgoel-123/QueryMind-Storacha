import { CHUNK_SIZE } from './config';
import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { JSDOM } from 'jsdom';


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

export async function extractMainContentFromUrl(url: string, p0: number): Promise<string> {
  const res = await fetch(url);
  const html = await res.text();
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const tagsToRemove = ['nav', 'footer', 'script', 'style', 'aside', 'form', 'noscript', 'svg', 'iframe'];
  tagsToRemove.forEach(tag => {
    document.querySelectorAll(tag).forEach(el => el.remove());
  });

  const selectors = ['article', 'main', '[role="main"]', '.content', '.post', '.entry', 'body'];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el && el.textContent && el.textContent.trim().length > 300) {
      return el.textContent.trim().replace(/\s{3,}/g, '\n\n');
    }
  }

  return document.body.textContent?.trim() || '';
}