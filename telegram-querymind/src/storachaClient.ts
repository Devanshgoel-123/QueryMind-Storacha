
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
  const j = (await resp.json()) as any;
  if (j.error) throw new Error(`RPC ${name} error: ${JSON.stringify(j.error)}`);
  if (!j.result?.content) throw new Error(`RPC ${name} bad result: ${JSON.stringify(j)}`);
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
  // 1) base64-encode
  const b64    = Buffer.from(chunk, 'utf8').toString('base64');

  // 2) call upload
  const result = await callTool('upload', {
    file:       b64,
    name:       filename,
    delegation: DELEGATION,
  });

  // 3) parse out files & root
  const payload = JSON.parse(result.content[0].text) as any;
  const files   = payload.files as Record<string, { '/': string }>;
  const rootCid = payload.root['/'] as string;
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

  const result  = await callTool('retrieve', { filepath });
  const textStr = result.content[0].text;
  if (!textStr) throw new Error(`Empty retrieve for ${filepath}`);

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
