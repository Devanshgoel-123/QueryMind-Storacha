import { getEmbedding } from "@/telegram-querymind/src/pipeline";
import { extractKeywords } from "@/telegram-querymind/src/pipeline";
import { answerWithContext } from "@/telegram-querymind/src/pipeline";
import { querySimilarEmbeddings } from "@/telegram-querymind/src/chromaClient";
import { ChunkMetadata } from "@/telegram-querymind/src/chromaClient";
import { fetchChunk } from "@/telegram-querymind/src/storachaClient";

export const getReply = async (question: string) => {
  const qVec = await getEmbedding(question);
  const result = await querySimilarEmbeddings(qVec);
  const cids = result.ids[0];
  const metadatas = result.metadatas[0] as ChunkMetadata[];

  const keywords = await extractKeywords(question);
  const candidates = cids
    .map((cid, i) => ({ cid, meta: metadatas[i] }))
    .filter(
      ({ meta }) =>
        meta?.rootCid &&
        meta.filename &&
        keywords.some((k) =>
          meta.summary.toLowerCase().includes(k.toLowerCase())
        )
    );

  if (candidates.length === 0) {
    return `❌ No current RAG knowledge base for (${keywords.join(", ")}).`;
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
  return answer;
};
