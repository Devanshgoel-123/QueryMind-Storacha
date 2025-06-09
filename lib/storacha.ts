import { MCP_ENDPOINT, MCP_Payload, StorachaResponse } from "@/types/storacha";
  
export const callStorachaServer = async (name: string, args: Record<string, any>): Promise<any | null> => {
    const payload: MCP_Payload = {
      jsonrpc: "2.0",
      id: Date.now().toString(),
      method: "tools/call",
      params: { name, arguments: args },
    };
  
    const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json",},
        body: JSON.stringify(payload),
      });
  
    const json: StorachaResponse = await res.json();
    const content = json?.result?.content?.[0]?.text;
    return content ? JSON.parse(content) : null;
  };
  