// Define the UploadParams and RetrieveParams interfaces
export interface MCP_Payload {
    jsonrpc: string;
    id: string;
    method: string;
    params: {
      name: string;
      arguments: Record<string, any>;
    };
  }
  
export interface StorachaResponse {
    result?: {
      content?: { text: string }[];
    };
  }
  
  // Define the API endpoint
 export const MCP_ENDPOINT = "http://localhost:3001/rest";

