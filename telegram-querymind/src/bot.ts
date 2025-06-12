import { Telegraf, session, Scenes, Markup } from 'telegraf';
import fetch from 'node-fetch';

import { TELEGRAM_TOKEN } from './config';
import { chunkText, extractTextFromPdf } from './utils';
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


const uploadWizard = new Scenes.WizardScene<MyContext>(
  'upload-wizard',

  
  async (ctx) => {
    await ctx.reply(
      'Do you want to upload raw text or a PDF/TXT document?',
      Markup.inlineKeyboard([
        Markup.button.callback('📝 Text', 'UPLOAD_TEXT'),
        Markup.button.callback('📄 PDF/TXT', 'UPLOAD_FILE'),
      ])
    );
    return ctx.wizard.next();
  },

  
  async (ctx) => {
    const data = (ctx.callbackQuery as any)?.data;
    await ctx.answerCbQuery();
    if (data === 'UPLOAD_TEXT') {
      // Mark upload mode in session
      (ctx.session as any).uploadMode = 'awaiting_text';
      await ctx.reply('Please *reply* to me with the text you want to upload:', { parse_mode: 'Markdown' });
      return ctx.wizard.next(); // go to text step
    }
    if (data === 'UPLOAD_FILE') {
      (ctx.session as any).uploadMode = 'awaiting_file';
      await ctx.reply('Please *reply* to me with a PDF or TXT file:', { parse_mode: 'Markdown' });
      return ctx.wizard.next(); // go to file receive step
    }
    // invalid choice
    await ctx.reply('Invalid choice, please click one of the buttons.');
    return ctx.wizard.selectStep(0);
  },

  
  async (ctx) => {
    const uploadMode = (ctx.session as any).uploadMode;

    // Text mode
    if (uploadMode === 'awaiting_text') {
      if (
        ctx.updateType === 'message' &&
        ctx.message &&
        'text' in ctx.message &&
        ctx.message.text
      ) {
        const text = ctx.message.text;
        await handleTextUpload(text, ctx);
        (ctx.session as any).uploadMode = undefined;
        return ctx.scene.leave();
      } else {
        await ctx.reply('Please reply with the text you want to upload.');
        return;
      }
    }

    // File mode
    if (uploadMode === 'awaiting_file') {
      if (
        ctx.updateType === 'message' &&
        ctx.message &&
        'document' in ctx.message &&
        ctx.message.document
      ) {
        const doc = ctx.message.document;
        const link = await ctx.telegram.getFileLink(doc.file_id);
        const res  = await fetch(link.href);
        const buffer = await res.buffer();

        let text: string;
        if (doc.mime_type === 'application/pdf') {
          text = await extractTextFromPdf(buffer);
        } else {
          text = buffer.toString('utf8');
        }

        await handleTextUpload(text, ctx);
        (ctx.session as any).uploadMode = undefined;
        return ctx.scene.leave();
      } else {
        await ctx.reply('Please reply with a PDF or TXT file.');
        return;
      }
    }

    // fallback if somehow invalid state
    await ctx.reply('Unexpected error — please try /upload again.');
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

  // a) embed + vector search
  const qVec = await getEmbedding(question);
  const result    = await querySimilarEmbeddings(qVec);
  const cids      = result.ids[0];
  const metadatas = result.metadatas[0] as ChunkMetadata[];

  // b) keyword extraction
  const keywords = await extractKeywords(question);
  console.log('🔑 Keywords:', keywords);

  // c) filter by keyword in summary
  const candidates = cids
    .map((cid, i) => ({ cid, meta: metadatas[i] }))
    .filter(({ cid, meta }) => {
      return (
        meta?.rootCid &&
        meta.filename &&
        keywords.some((k) => meta.summary.toLowerCase().includes(k.toLowerCase()))
      );
    });

  if (candidates.length === 0) {
    return ctx.reply(
       `❌ No current RAG knowledge base for (${keywords.join(', ')}).`
    );
  }

  // d) fetch contexts
  const contexts: string[] = [];
  for (const { cid, meta } of candidates) {
    const txt = await fetchChunk(meta.rootCid, meta.filename);
    contexts.push(`Summary: ${meta.summary}\n\n${txt}`);
  }

  // e) final answer
  const answer = await answerWithContext(contexts, question);
  await ctx.reply(answer);
});

// ── shared upload/index pipeline ──
async function handleTextUpload(text: string, ctx: Scenes.WizardContext) {
  const chunks = chunkText(text);
  await ctx.reply(`🚀 Uploading ${chunks.length} chunk(s)…`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk    = chunks[i];
    const filename = `chunk_${Date.now()}_${i}.txt`;

    // upload
    const { fileCid, rootCid } = await uploadChunk(chunk, filename);
    console.log(`[UPLOAD] ${i+1}/${chunks.length}: ${fileCid}`);
    await ctx.reply(
      `✅ Uploaded chunk ${i+1}/${chunks.length}\n• CID: \`${fileCid}\`\n• root: \`${rootCid}\``,
      { parse_mode: 'MarkdownV2' }
    );

    // summarize & embed
    const summary   = await summarizeChunk(chunk);
    const embedding = await getEmbedding(chunk);

    // index
    await upsertChunkEmbedding(fileCid, embedding, { rootCid, filename, summary });
    console.log(`[INDEX] ${i+1}/${chunks.length} indexed`);
  }

  await ctx.reply('🎉 All chunks uploaded & indexed!');
}


bot.launch();
console.log('🤖 Bot is running');
