import {
  CloudClient,
  QueryResult,
  Metadata,
} from 'chromadb';
import {
  CHROMA_API_KEY,
  CHROMA_TENANT,
  CHROMA_DATABASE,
  CHROMA_COLLECTION,
  TOP_K,
} from './config';

export interface ChunkMetadata extends Metadata {
  rootCid:  string;
  filename: string;
  summary:  string;
}

const chroma = new CloudClient({
  apiKey:  CHROMA_API_KEY,
  tenant:  CHROMA_TENANT,
  database: CHROMA_DATABASE,
});

async function getOrCreate() {
  try {
    const col = await chroma.getCollection({ name: CHROMA_COLLECTION });
    console.log(`✅ ChromaDB: found '${CHROMA_COLLECTION}'`);
    return col;
  } catch {
    console.log(`ℹ️  ChromaDB: creating '${CHROMA_COLLECTION}'`);
    const col = await chroma.createCollection({
      name: CHROMA_COLLECTION,
    });
    console.log(`✅ ChromaDB: created '${CHROMA_COLLECTION}'`);
    return col;
  }
}

const collectionPromise = getOrCreate();

export async function upsertChunkEmbedding(
  cid: string,
  embedding: number[],
  metadata: ChunkMetadata
): Promise<void> {
  const col = await collectionPromise;
  console.log(`🔨 ChromaDB: adding CID=${cid}, rootCid=${metadata.rootCid}, file=${metadata.filename}`);
  const shortSummary = metadata.summary.slice(0, 200); // truncate to avoid 256B limit
await col.add({
  ids:        [cid],
  embeddings: [embedding],
  metadatas:  [{
    ...metadata,
    summary: shortSummary,
  }],
  documents:  [shortSummary],
});

  console.log(`✅ ChromaDB: indexed CID=${cid}`);
}

export async function querySimilarEmbeddings(
  vector: number[]
): Promise<QueryResult<ChunkMetadata>> {
  const col = await collectionPromise;
  console.log(`🔍 ChromaDB: querying top ${TOP_K} with vector length ${vector.length}`);
  const res = await col.query({
    queryEmbeddings: [vector],
    nResults:        TOP_K,
  });
  console.log(`✅ ChromaDB: query returned IDs`, res.ids[0]);
  console.log(`✅ ChromaDB: query returned metadatas`, res.metadatas[0]);
  return res as QueryResult<ChunkMetadata>;
}
