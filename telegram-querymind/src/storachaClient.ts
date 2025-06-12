import fetch from 'node-fetch';
import { MCP_REST_URL, DELEGATION } from './config';

interface JsonRpc {
  jsonrpc: '2.0';
  id:     string;
  method: string;
  params: any;
}

interface RpcResult {
  content: Array<{ text: string }>;
}

async function callTool(name: string, args: any): Promise<RpcResult> {
  const body: JsonRpc = {
    jsonrpc: '2.0',
    id:     '1',
    method: 'tools/call',
    params: { name, arguments: args },
  };

  const resp = await fetch(MCP_REST_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  // 1) check HTTP status
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`HTTP ${resp.status} ${resp.statusText}: ${text}`);
  }

  // 2) parse as JSON safely
  const j = (await resp.json()) as any;

  // 3) check for explicit RPC error
  if (j.error) {
    throw new Error(`RPC ${name} error: ${JSON.stringify(j.error)}`);
  }

  // 4) ensure content is valid array
  if (!j.result?.content || !Array.isArray(j.result.content)) {
    throw new Error(`RPC ${name} bad result: ${JSON.stringify(j)}`);
  }

  return j.result as RpcResult;
}

export interface UploadResult {
  fileCid:  string;
  rootCid:  string;
  filename: string;
}

export async function uploadChunk(
  chunk: string,
  filename: string
): Promise<UploadResult> {
  const b64 = Buffer.from(chunk, 'utf8').toString('base64');

  const result = await callTool('upload', {
    file:       b64,
    name:       filename,
    delegation: DELEGATION,
  });

  const payload = JSON.parse(result.content[0].text) as any;

  // 🛡️ added safety checks:
  if (!payload.files || Object.keys(payload.files).length === 0) {
    throw new Error(`RPC upload returned no files: ${JSON.stringify(payload)}`);
  }
  if (!payload.root || !payload.root['/']) {
    throw new Error(`RPC upload missing rootCid: ${JSON.stringify(payload)}`);
  }

  const files   = payload.files as Record<string, { '/': string }>;
  const rootCid = payload.root['/'] as string;

  if (!files[filename] || !files[filename]['/']) {
    throw new Error(
      `RPC upload missing CID for '${filename}': ${JSON.stringify(files)}`
    );
  }

  const fileCid = files[filename]['/'];

  console.log(`📥 [MCP] uploaded '${filename}' → fileCid=${fileCid}, rootCid=${rootCid}`);
  return { fileCid, rootCid, filename };
}

export async function fetchChunk(
  fileCid: string,
  filename: string
): Promise<string> {
  const filepath = `${fileCid}/${filename}`;
  console.log(`📥 [MCP] retrieving filepath=${filepath}`);

  const result = await callTool('retrieve', { filepath });

  if (!result.content || result.content.length === 0 || !result.content[0].text) {
    throw new Error(`RPC retrieve bad result for ${filepath}: ${JSON.stringify(result)}`);
  }

  const textStr = result.content[0].text;

  // assume raw base64
  const decoded = Buffer.from(textStr, 'base64').toString('utf8');
  console.log(
    `📥 [MCP] fetched ${filename} (length ${decoded.length}), first 200 chars:\n${decoded.slice(
      0,
      200
    )}\n`
  );

  return decoded;
}
