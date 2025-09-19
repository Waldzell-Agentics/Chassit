import { z } from 'zod';

export const JsonRpcRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]),
  method: z.string(),
  params: z.any().optional()
});

export const JsonRpcResponseSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]),
  result: z.any().optional(),
  error: z.object({
    code: z.number(),
    message: z.string(),
    data: z.any().optional()
  }).optional()
});

export const JsonRpcNotificationSchema = z.object({
  jsonrpc: z.literal('2.0'),
  method: z.string(),
  params: z.any().optional()
});

export const MCPInitializeRequestSchema = z.object({
  protocolVersion: z.string(),
  capabilities: z.object({
    tools: z.object({}).optional(),
    resources: z.object({}).optional(),
    prompts: z.object({}).optional()
  }),
  clientInfo: z.object({
    name: z.string(),
    version: z.string()
  })
});

export const MCPTransportConfigSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('stdio'),
    command: z.string(),
    args: z.array(z.string()).optional()
  }),
  z.object({
    type: z.literal('streamable-http'),
    url: z.string().url(),
    headers: z.record(z.string()).optional()
  })
]);