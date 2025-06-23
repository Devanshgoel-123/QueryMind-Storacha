import { Telegraf, session, Scenes, Markup } from 'telegraf';
import fetch, { RequestInit } from 'node-fetch';
import { TELEGRAM_TOKEN } from './config';
import { chunkText, extractTextFromPdf, extractMainContentFromUrl } from './utils';
import {
  summarizeChunk,
  getEmbedding,
  extractKeywords,
  answerWithContext,
} from './pipeline';
import { uploadChunk, fetchChunk } from './storachaClient';
import {
  upsertChunkEmbedding,
  querySimilarEmbeddings,
  ChunkMetadata,
} from './chromaClient';

interface MyContext extends Scenes.WizardContext {}

const uploadModes = {
  UPLOAD_TEXT: 'awaiting_text',
  UPLOAD_FILE: 'awaiting_file',
  UPLOAD_URL: 'awaiting_url',
} as const;

const uploadWizard = new Scenes.WizardScene<MyContext>(
  'upload-wizard',

  async (ctx) => {
    await ctx.reply(
      'Do you want to upload raw text, a PDF/TXT document, or a URL?',
      Markup.inlineKeyboard([
        Markup.button.callback('📝 Text', 'UPLOAD_TEXT'),
        Markup.button.callback('📄 PDF/TXT', 'UPLOAD_FILE'),
        Markup.button.callback('🌐 URL', 'UPLOAD_URL'),
      ])
    );
    return ctx.wizard.next();
  },

  async (ctx) => {
    const data = (ctx.callbackQuery as any)?.data;
    await ctx.answerCbQuery();
    (ctx.session as any).uploadMode = uploadModes[data as keyof typeof uploadModes];

    switch (data) {
      case 'UPLOAD_TEXT':
        await ctx.reply('Please *reply* with the text to upload:', { parse_mode: 'Markdown' });
        break;
      case 'UPLOAD_FILE':
        await ctx.reply('Please *reply* with a PDF or TXT file:', { parse_mode: 'Markdown' });
        break;
      case 'UPLOAD_URL':
        await ctx.reply('Please *reply* with a valid URL:', { parse_mode: 'Markdown' });
        break;
      default:
        await ctx.reply('Invalid choice, please try again.');
        return ctx.wizard.selectStep(0);
    }
    return ctx.wizard.next();
  },

  async (ctx) => {
    const uploadMode = (ctx.session as any).uploadMode;

    if (ctx.updateType !== 'message' || !ctx.message) {
      await ctx.reply('Please reply with a valid input.');
      return;
    }

    const msg = ctx.message;

    if (uploadMode === 'awaiting_text' && 'text' in msg) {
      await handleTextUpload(msg.text, ctx);
    }

    else if (uploadMode === 'awaiting_file' && 'document' in msg) {
      const doc = msg.document;
      const link = await ctx.telegram.getFileLink(doc.file_id);
      const res = await fetch(link.href);
      const buffer = await res.buffer();

      let text: string;
      if (doc.mime_type === 'application/pdf') {
        text = await extractTextFromPdf(buffer);
      } else {
        text = buffer.toString('utf8');
      }

      await handleTextUpload(text, ctx);
    }

    else if (uploadMode === 'awaiting_url' && 'text' in msg) {
      const url = msg.text.trim();
      await ctx.reply(`🔗 Fetching content from ${url}...`);
      try {
        const html = await extractMainContentFromUrl(url, 150000); // 150 sec timeout
        if (html.length < 100) {
          await ctx.reply('❌ Couldn’t extract enough meaningful content from the URL.');
        } else {
          await handleTextUpload(html, ctx);
        }
      } catch (e) {
        console.error('URL fetch error:', e);
        await ctx.reply('❌ Failed to fetch or parse the URL.');
      }
    }

    else {
      await ctx.reply('Please reply with valid content.');
      return;
    }

    (ctx.session as any).uploadMode = undefined;
    return ctx.scene.leave();
  }
);

const stage = new Scenes.Stage<MyContext>([uploadWizard]);
const bot = new Telegraf<MyContext>(TELEGRAM_TOKEN);

bot.use(session());
bot.use(stage.middleware());

bot.command('upload', (ctx) => ctx.scene.enter('upload-wizard'));

bot.command('query', async (ctx) => {
  const question = ctx.message.text.slice(6).trim();
  await ctx.reply(`🔍 Searching for “${question}”…`);

  const qVec = await getEmbedding(question);
  const result = await querySimilarEmbeddings(qVec);
  const cids = result.ids[0];
  const metadatas = result.metadatas[0] as ChunkMetadata[];

  const keywords = await extractKeywords(question);
  const candidates = cids
    .map((cid, i) => ({ cid, meta: metadatas[i] }))
    .filter(({ meta }) =>
      meta?.rootCid &&
      meta.filename &&
      keywords.some(k => meta.summary.toLowerCase().includes(k.toLowerCase()))
    );

  if (candidates.length === 0) {
    return ctx.reply(`❌ No current RAG knowledge base for (${keywords.join(', ')}).`);
  }

let totalTokenEstimate = 0;
const contexts: string[] = [];

for (const { meta } of candidates) {
  const txt = await fetchChunk(meta.rootCid, meta.filename);
  const fullContext = `Summary: ${meta.summary}\n\n${txt}`;
  const tokenEstimate = Math.ceil(fullContext.length / 4); 

  if (totalTokenEstimate + tokenEstimate > 14000) break;
  totalTokenEstimate += tokenEstimate;
  contexts.push(fullContext);
}

  const answer = await answerWithContext(contexts, question);
  await ctx.reply(answer);
});

// Shared chunk handler
async function handleTextUpload(text: string, ctx: Scenes.WizardContext) {
  const chunks = chunkText(text);
  await ctx.reply(`🚀 Uploading ${chunks.length} chunk(s)…`);

  await Promise.all(chunks.map(async (chunk, i) => {
    const filename = `chunk_${Date.now()}_${i}.txt`;
    const { fileCid, rootCid } = await uploadChunk(chunk, filename);

    const summary = await summarizeChunk(chunk);
    const embedding = await getEmbedding(chunk);

    await upsertChunkEmbedding(fileCid, embedding, { rootCid, filename, summary });

    await ctx.reply(
      `✅ Uploaded chunk ${i + 1}/${chunks.length}\n• CID: \`${fileCid}\`\n• root: \`${rootCid}\``,
      { parse_mode: 'MarkdownV2' }
    );
  }));

  await ctx.reply('🎉 All chunks uploaded & indexed!');
}

bot.launch();
console.log('🤖 Bot is running');
