import { Telegraf } from 'telegraf';
import { TELEGRAM_TOKEN } from './config';
import { chunkText } from './utils';
import {
  summarizeChunk,
  getEmbedding,
  answerWithContext,
  extractKeywords,
} from './pipeline';
import {
  uploadChunk,
  fetchChunk,
  UploadResult,
} from './storachaClient';
import {
  upsertChunkEmbedding,
  querySimilarEmbeddings,
  ChunkMetadata,
} from './chromaClient';

const bot = new Telegraf(TELEGRAM_TOKEN);


bot.command('upload_text', async (ctx) => {
  const text   = ctx.message.text.slice(12).trim();
  const chunks = chunkText(text);
  await ctx.reply(`🚀 Processing ${chunks.length} chunks…`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk    = chunks[i];
    const filename = `chunk_${i}.txt`;

    // 1) upload to MCP
    const { fileCid, rootCid } = (await uploadChunk(chunk, filename)) as UploadResult;

    // 2) summarize & embed
    const summary   = await summarizeChunk(chunk);
    const embedding = await getEmbedding(chunk);

    // 3) index in Chroma with full metadata
    const metadata: ChunkMetadata = { rootCid, filename, summary };
    await upsertChunkEmbedding(fileCid, embedding, metadata);
  }

  await ctx.reply(`✅ Uploaded & indexed ${chunks.length} chunks.`);
});



bot.command('query', async (ctx) => {
  const question = ctx.message.text.slice(6).trim();
  await ctx.reply(`🔍 Searching for “${question}”…`);

  // 1) embed question
  const qVec = await getEmbedding(question);

  // 2) vector search
  const result    = await querySimilarEmbeddings(qVec);
  const cids      = result.ids[0];
  const metadatas = result.metadatas[0] as ChunkMetadata[];

  // 3) ask AI for the top keywords
  const keywords = await extractKeywords(question);
  console.log('🔑 Extracted keywords:', keywords);

  // 4) filter down to only those chunks whose *summary* or *text* contains at least one keyword
  const candidates = [];
  for (let i = 0; i < cids.length; i++) {
    const cid  = cids[i];
    const meta = metadatas[i];
    if (!meta?.rootCid || !meta.filename) continue;

    const hay = (meta.summary + ' ').toLowerCase();
    if (keywords.some(k => hay.includes(k.toLowerCase()))) {
      candidates.push({ cid, meta });
    } else {
      console.log(`🔎 Excluding ${cid} (no keyword match)`);
    }
  }

  // 5) if nothing matched, bail out
  if (candidates.length === 0) {
    return ctx.reply(
      `❌ Couldn’t find any chunks mentioning your keywords (${keywords.join(
        ', '
      )}).`
    );
  }
  console.log(`✅ ${candidates.length} chunks passed keyword filter`);

  // 6) retrieve & assemble contexts
  const contexts: string[] = [];
  for (const { cid, meta } of candidates) {
    console.log(`📥 Fetching ${cid} from ${meta.rootCid}/${meta.filename}`);
    const txt = await fetchChunk(meta.rootCid, meta.filename);
    contexts.push(`Summary: ${meta.summary}\n\n${txt}`);
  }

  // 7) final answer
  const answer = await answerWithContext(contexts, question);
  await ctx.reply(answer);
});
bot.launch();
console.log('🤖 Bot is running');
