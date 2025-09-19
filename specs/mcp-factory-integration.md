# MCP Factory Integration Specification

## Summary
This specification outlines the integration of the MCP client factory (`packages/api/mcp/factory.mts`) into the Chassit application. The factory provides a robust way to create and connect MCP clients using the official `@modelcontextprotocol/sdk`, supporting Streamable HTTP and Stdio transports with timeout handling, error management, and session support. Integration will enable delegation of AI tasks (e.g., web searches, doc lookups) to external MCP servers, enhancing modularity and reducing local compute. This builds on existing MCP architecture docs and prior integration specs, focusing on practical usage in `ai/generate.mts` and `server/ws.mts`.

Key goals:
- Seamless MCP client creation for AI workflows.
- WebSocket proxying for real-time UI feedback.
- Secure credential management via secrets DB.
- Backward compatibility with existing patterns.

## Rationale
The MCP factory is implemented but unused, as per codebase analysis. Integrating it unlocks:
- **External Capabilities**: Access to MCP servers like 'context7' (docs), 'exa' (search), 'github' (VC) without custom code.
- **Scalability**: Offload heavy tasks (e.g., research) to specialized services.
- **Standards Compliance**: Uses MCP 2025-06-18 protocol (JSON-RPC 2.0 over sHTTP/Stdio).
- **Security**: OAuth 2.1 via secrets, user approvals for tools.
- **UX**: Streaming responses via SSE/WebSocket for progress updates.

Without integration, the factory remains dead code; this spec ensures adoption aligns with Chassit's WebSocket-first, AI-orchestrated architecture.

## Functional Requirements
1. **Client Creation**:
   - Support dynamic factory calls: `await createTransport({ url: 'https://mcp-server.com', sessionId: 'xyz' })`.
   - Auto-detect transport (HTTP vs. Stdio) based on config.
   - Handle session resume for resumable operations.

2. **AI Workflow Integration** (`packages/api/ai/generate.mts`):
   - Detect MCP-eligible tasks (e.g., "search web", "read docs") in prompts.
   - Invoke: `client.callTool('search', { query: '...' })` with user approval.
   - Stream results back to AI parser for inclusion in responses.

3. **Server Channel Integration** (`packages/api/server/ws.mts` and channels):
   - New channel: `mcp:<sessionId>` for UI-initiated calls.
   - Proxy WebSocket messages to MCP: e.g., `{ type: 'mcp_tool', server: 'exa', tool: 'search', args: { query } }`.
   - Broadcast streaming notifications (SSE via WebSocket) for real-time UI.

4. **Configuration & Secrets**:
   - Store MCP server configs (URL, API keys) in DB/secrets table.
   - UI settings panel for adding/editing servers (extend `routes/settings.tsx`).
   - OAuth flow: Use PKCE for token acquisition.

5. **Error & Lifecycle**:
   - Retry logic (3x) on transient errors (e.g., timeouts).
   - Graceful shutdown: `client.close()` on session end.
   - Logging: PostHog events for MCP usage analytics.

## Non-Functional Requirements
- **Performance**: Connection timeout <10s; streaming latency <500ms.
- **Security**: Validate/sanitize args; no direct client exposure; secrets encrypted.
- **Reliability**: 99% uptime for integrations; unit tests >80% coverage.
- **Maintainability**: Modular; <500 LOC per file; Zod schemas for payloads.
- **Compatibility**: No breaking changes; support Node 18+.

## Architecture & Design
### High-Level Flow
```mermaid
graph TD
    A[Web UI / AI Prompt] --> B[WebSocket Channel (ws.mts)]
    B --> C[MCP Factory (factory.mts)]
    C --> D[MCP Client (SDK)]
    D --> E[External MCP Server (sHTTP/Stdio)]
    E --> D
    D --> F[AI Parser (ai/generate.mts)]
    F --> B
    B --> A
    G[Secrets DB] --> C
    H[PostHog] --> D
```

- **Factory Role**: Central entrypoint; abstracts SDK details.
- **Transport Selection**: HTTP for remote (e.g., exa), Stdio for local (e.g., custom tools).
- **Proxy Pattern**: WebSocket → Factory → SDK → External; stream back via events.
- **Approval Hooks**: In AI: Prompt user before tool calls (e.g., "Approve search?").

### Interfaces
- **Config**: Extend `TransportConfig` with `serverName: string` for multi-server.
- **MCP Response**: Zod schema for `tools/call`, `resources/read` results.
- **Events**: `client.on('notification', handler)` for streaming.

## Implementation Steps
### Phase 1: Core Integration (Week 1)
1. **Import Factory**: In `ai/generate.mts`, add `import { createTransport } from '../mcp/factory.mts';`.
2. **Task Detection**: Parse prompts for MCP keywords; map to tools (e.g., "search" → exa/search).
3. **Client Invocation**:
   ```typescript
   const client = await createTransport({ url: config.servers.exa.url, sessionId });
   await client.initialize();
   const result = await client.callTool('search', { query });
   ```
4. **Error Handling**: Wrap in try-catch; fallback to local if MCP fails.
5. **Secrets Integration**: Fetch API keys from DB before connect.

### Phase 2: WebSocket & UI (Week 2)
1. **Channel Setup**: In `server/ws.mts`, register `wss.channel('mcp').on('call', handler);`.
2. **Handler Logic**:
   ```typescript
   async function mcpCall(sessionId: string, payload: { tool: string, args: any }) {
     const client = await createTransport({ /* from session */ });
     const result = await client.callTool(payload.tool, payload.args);
     session.broadcast({ type: 'mcp_result', result });
   }
   ```
3. **Streaming**: Use `client.on('notification', (notif) => session.broadcast(notif));`.
4. **UI Extension**: Add MCP button in session menu; modal for server config.

### Phase 3: Testing & Polish (Week 3)
1. **Unit Tests**: `packages/api/test/mcp-factory.test.mts` – mock SDK, test timeout/guards.
2. **Integration Tests**: Mock external server; verify end-to-end AI delegation.
3. **E2E**: Use srcbook to simulate UI → MCP call.
4. **Docs**: Update README; add examples in `packages/api/mcp/examples/`.

## Testing Strategy
- **Unit**: Vitest for factory (e.g., timeout rejection, transport typing).
- **Integration**: Mock MCP server (e.g., nock for HTTP); test AI delegation.
- **E2E**: Playwright for UI flows; verify WebSocket → MCP roundtrip.
- **Edge Cases**: Invalid config, network failure, long streams.
- **Coverage**: >90% for new code; include flaky test mitigation.

## Risks & Mitigations
- **SDK Changes**: Pin version; abstract if needed.
- **External Dependencies**: Fallback to local tools.
- **Security**: Audit OAuth; rate-limit calls.
- **Performance**: Profile streaming; cache sessions.

## References
- [MCP Spec 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18)
- [Prior MCP Integration Spec](specs/mcp-client-integration/01-mcp-client-integration.md)
- [Architecture Doc](packages/api/mcp/architecture.md)
- [SDK Docs](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- [Chassit Patterns](README.md)