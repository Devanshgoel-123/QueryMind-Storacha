import fetch from 'node-fetch';
import { Buffer } from 'buffer';

async function main() {
  const [,, fileCid, filename] = process.argv;
  if (!fileCid || !filename) {
    console.error('Usage: ts-node scripts/manualFetch.ts <file> <filename>');
    process.exit(1);
  }

  const MCP_REST_URL = process.env.MCP_REST_URL || 'https://5507-164-52-202-62.ngrok-free.app/rest';
  const filepath     = `${fileCid}/${filename}`;
  console.log(`🔗 Retrieving via MCP REST at ${MCP_REST_URL}`);
  console.log(`📂 Filepath: ${filepath}\n`);

  // JSON‐RPC call
  const resp = await fetch(MCP_REST_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id:      'manual-fetch',
      method:  'tools/call',
      params:  { name: 'retrieve', arguments: { filepath } },
    }),
  });
  const j = await resp.json() as any;
  if (j.error) {
    console.error('❌ RPC error:', j.error);
    process.exit(1);
  }

  const textB64 = j.result?.content?.[0]?.text;
  if (!textB64) {
    console.error('❌ No `text` field in response:', JSON.stringify(j, null, 2));
    process.exit(1);
  }

  // decode and print
  let decoded: string;
  try {
    decoded = Buffer.from(textB64, 'base64').toString('utf8');
  } catch (err) {
    console.error('❌ Base64 decode failed:', err);
    process.exit(1);
  }

  console.log('✅ Decoded content:\n');
  console.log(decoded);
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});