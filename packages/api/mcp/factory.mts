import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export interface TransportConfig {
  type?: 'http' | 'stdio';
  url?: string;
  command?: string;
  args?: string[];
  sessionId?: string;
  clientName?: string;
  clientVersion?: string;
}

export async function detectTransportType(url: string): Promise<'streamable-http' | 'legacy-sse' | 'unknown'> {
  const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;

  // Try POST with MCP-Protocol-Version for streamable HTTP
  try {
    const probeResponse = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'MCP-Protocol-Version': '2025-06-18',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'initialize',
        params: {},
        id: 'probe',
      }),
    });

    if (probeResponse.ok && probeResponse.headers.get('Mcp-Protocol-Version') === '2025-06-18') {
      return 'streamable-http';
    }
  } catch {
    // Ignore errors, fallback to legacy check
  }

  // Fallback to legacy SSE GET check
  try {
    const sseResponse = await fetch(`${baseUrl}/notifications`, {
      method: 'GET',
      headers: { 'Accept': 'text/event-stream' },
    });

    if (sseResponse.ok && sseResponse.headers.get('Content-Type')?.includes('text/event-stream')) {
      return 'legacy-sse';
    }
  } catch {
    // Ignore errors
  }

  return 'unknown';
}

export async function createTransport(config: TransportConfig): Promise<Client> {
  if (!config.url && !config.command) {
    throw new Error('Either url or command must be provided in config');
  }

  const client = new Client({
    name: config.clientName || 'srcbook',
    version: config.clientVersion || '1.0.0',
  });

  let transport: StreamableHTTPClientTransport | StdioClientTransport;
  if (config.url) {
    transport = new StreamableHTTPClientTransport(new URL(config.url));
  } else if (config.command) {
    transport = new StdioClientTransport({
      command: config.command,
      args: config.args || [],
    });
  } else {
    throw new Error('Invalid transport config: must provide url or command');
  }

  // Connect to MCP server with 10s timeout to prevent indefinite hanging
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('MCP connection timeout after 10s')), 10000)
  );

  try {
    await Promise.race([client.connect(transport), timeoutPromise]);
    console.log('MCP client connected successfully');
  } catch (error) {
    if (error instanceof Error && error.message.includes('timeout')) {
      console.error('MCP connection timed out after 10s');
    } else {
      console.error('Failed to connect MCP client:', error);
    }
    throw error; // Rethrow for caller to handle (e.g., retry or fallback)
  }

  if (config.sessionId) {
    // Handle session resume if needed; SDK may support via transport options
    console.warn('Session resume not fully implemented in this factory; use SDK methods directly');
  }

  return client;
}