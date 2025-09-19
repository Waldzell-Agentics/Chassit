# MCP Client Integration for Chassit

## Summary
Integration of an MCP (Model Context Protocol) client into the Chassit project to enable seamless connection to external data sources and tools via the standardized MCP protocol, prioritizing Streamable HTTP (sHTTP) as the primary transport per MCP specification. This enhancement allows Chassit to delegate tasks like web searches, documentation lookups, and tool execution to external MCP servers using JSON-RPC 2.0 over sHTTP (HTTP POST for client-to-server messages and Server-Sent Events (SSE) for server-to-client streaming), with session management via Mcp-Session-Id header. Existing WebSocket setup will be adapted for compatibility (e.g., proxy WS to sHTTP or use WS as custom transport preserving JSON-RPC), reducing local compute requirements and enhancing modularity while maintaining the existing architecture's strengths. MCP ensures secure, user-approved interactions with OAuth 2.1 authorization.

## Problem Statement
Chassit currently lacks native external service integration capabilities, relying entirely on local processes and databases for all operations. This limitation prevents the system from leveraging powerful external AI services, web search capabilities, and third-party tool integrations that could significantly enhance the development experience. The absence of a standardized interface for external services creates a bottleneck in AI generation workflows and limits the system's ability to scale beyond local resources. MCP addresses this by providing a JSON-RPC 2.0-based protocol for secure tool and resource access.

## Rationale
## Rationale
The MCP (Model Context Protocol) provides a standardized, secure protocol based on JSON-RPC 2.0 and OAuth 2.1 for AI applications to connect to data sources and tools, with Streamable HTTP (sHTTP) as the primary transport mechanism (HTTP POST for client-to-server JSON-RPC messages and SSE for server-to-client streaming/responses, managed via Mcp-Session-Id header). By integrating MCP into Chassit:
- **Modularity**: External capabilities can be added without modifying core code
- **Scalability**: Offload compute-intensive tasks to specialized services
- **Ecosystem Access**: Connect to existing MCP servers (context7 for docs, exa for search, github for version control)
- **Security**: Leverage MCP's OAuth 2.1 authorization, PKCE, user approvals for tools, and secure transports
- **Future-Proofing**: Align with industry standards for AI service integration, including lifecycle management (initialization, operation, shutdown)

Prior art includes successful MCP implementations in Claude Desktop, VS Code Copilot, and other AI development environments, demonstrating the protocol's maturity and reliability across 70+ clients.
## Requirements

### Functional Requirements
- Implement MCP client module in `packages/api/mcp/client.mts` with tool and resource invocation capabilities using JSON-RPC 2.0 methods (e.g., tools/list, tools/call, resources/list, resources/read)
- Support URI-based resource access (e.g., file://, https://) and schema-defined tool arguments
- Support sHTTP as primary transport: HTTP POST for client-to-server JSON-RPC messages and Server-Sent Events (SSE) for server-to-client streaming/responses, with authentication headers (e.g., Mcp-Session-Id for session management), routed through existing backend
- Enable configuration of MCP server endpoints, OAuth 2.1 credentials, and roots via settings UI
- Support asynchronous streaming of MCP responses and lifecycle management (initialization, operation, shutdown)
- Maintain compatibility with existing AI workflow in `ai/generate.mts`, with user approval hooks for tool executions

### Non-Functional Requirements
- Zero additional external dependencies initially (use existing HTTP utilities for JSON-RPC over sHTTP, ensuring minimal latency with SSE streaming)
- Type-safe integration using Zod schemas in shared package for MCP requests/responses
- Secure credential management using existing secrets table, with OAuth 2.1 token handling and PKCE
- Minimal latency impact on real-time operations via progressive enhancement and capability negotiation
- Comprehensive error handling for JSON-RPC errors, tool failures, and lifecycle events; logging via existing PostHog integration
- Backward compatibility with existing Chassit functionality, with graceful degradation for unsupported MCP features

## Non-Goals
- Parallel MCP operation execution (per MCP principles: one operation at a time)
- Direct client-to-MCP communication (must route through backend for security)
- Custom MCP server implementation (focus on client capabilities only)
- Migration of existing local functionality to MCP (augmentation only)
- Support for non-standard MCP protocols or extensions

## Architecture
### High-Level Design
The MCP client integrates as a new module within the API package, accessible through backend-routed sHTTP (prioritizing HTTP POST for requests and SSE for responses) for MCP operations and AI workflows, with WebSocket adaptation via proxying to sHTTP or custom WS transport preserving JSON-RPC:

```mermaid
graph TD
    A[Chassit Web UI] --> B[WebSocket Client]
    B --> C[WS Server api/server/ws.mts]
    C --> D[MCP Client api/mcp/client.mts]
    D -->|HTTP POST (JSON-RPC req)| E[External MCP Servers via sHTTP]
    E -->|SSE (streaming resp)| D
    D -->|Proxy/Adapt| C
    C --> B
    B --> A
    F[Secrets DB for OAuth Tokens] --> D
    G[AI Parser with Approval Hooks] --> D
    H[Lifecycle Manager] --> D
    I[WS Proxy to sHTTP] -.->|Fallback/Custom| D
```
```

### Key Components

#### MCP Client Module (`packages/api/mcp/client.mts`)
- `invokeTool(server: string, tool: string, args: object): Promise<MCPResponse>` (via tools/call with user approval)
- `accessResource(server: string, uri: string): Promise<MCPResource>` (via resources/read)
- JSON-RPC 2.0 formatting and sHTTP transport handlers (HTTP POST for requests, SSE for streaming responses, including Mcp-Session-Id for session management)
- Lifecycle management (initialize, shutdown), retry logic, and JSON-RPC error recovery

#### Schema Extensions (`packages/shared/src/schemas/mcp.mts`)
- Zod schemas for MCP JSON-RPC requests/responses, tool schemas, and resource metadata
- Type definitions for tool arguments (JSON Schema), resource URIs, and OAuth 2.1 tokens
- Error type definitions for MCP-specific failures (JSON-RPC codes) and authorization errors

#### Channel Integration (`packages/api/server/channels/mcp.mts`)
- New backend-routed handlers for MCP operations over WebSocket (proxied to sHTTP: POST/SSE)
- Message types: `mcp_tool` (with approval), `mcp_resource`, `mcp_status`, `mcp_lifecycle`
- SSE event integration for streaming responses and progress notifications from external servers

#### Settings Integration (`packages/web/src/routes/settings.tsx`)
- UI for configuring MCP server endpoints, roots, and OAuth 2.1 credentials (with PKCE support)
- Credential management interface for secure token storage
- Server status indicators, capability negotiation, and connection health (ping)

### Interfaces
- **WebSocket Messages**: Extended to include MCP operation types (proxied to sHTTP endpoints for POST/SSE, preserving JSON-RPC format)
- **AI Workflow Hooks**: Detection points for MCP-delegatable tasks with user approval for tools
- **Configuration API**: RESTful endpoints for MCP server management, roots, and OAuth scopes
- **Streaming Protocol**: Server-Sent Events (SSE) for MCP response streaming and progress

## Implementation Plan

### Phase 1: Foundation (Week 1-2)
- Create MCP client module with JSON-RPC 2.0 initialization, basic tool/resource methods, and sHTTP handlers (POST/SSE with Mcp-Session-Id)
- Implement Zod schemas for MCP types, including OAuth 2.1 and tool schemas
- Add configuration storage in secrets table for endpoints, tokens, and roots
- Unit tests for client functions, lifecycle, and error handling

### Phase 2: Integration (Week 3-4)
- Integrate SSE handling in WS server and proxy sHTTP (POST/SSE) via WebSocket
- Create MCP channel handler with user approval flows
- Connect to AI workflow for task delegation, including sampling and elicitation hooks
- Integration tests with mock MCP servers (stdio/sHTTP)

### Phase 3: UI and Polish (Week 5-6)
- Build settings UI for MCP configuration, including transport selection (sHTTP primary, WS fallback), OAuth flows, and capability lists
- Add status indicators, progress tracking, and error displays for JSON-RPC failures
- Create srcbook examples for MCP usage (tools, resources, prompts)
- End-to-end testing with real MCP servers (e.g., filesystem, github)

### Dependencies
- Existing Chassit infrastructure (no new external deps)
- Access to MCP server documentation
- Test MCP server endpoints for validation

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Network Latency | Degraded real-time performance | Async SSE streaming with buffering, WS fallback for compatibility, configurable timeouts, ping health checks |
| Security Vulnerabilities | Data exposure, unauthorized access | OAuth 2.1 with PKCE, user approvals for tools, secure token storage, origin validation |
| Type Compatibility | Runtime errors from dynamic payloads | Comprehensive Zod schemas, JSON-RPC validation, extensive testing |
| Dependency Creep | Increased complexity | Isolate MCP logic, no external libraries initially; use official SDK patterns |
| MCP Server Failures | Feature unavailability | Graceful degradation, capability negotiation, user-friendly error messages |
| Transport Errors | Connection disruptions | Implement ping/pong for connection health, automatic reconnection for sHTTP/SSE, error logging for session management |

## Success Metrics
- **Integration Complete**: MCP client successfully connects to at least 3 external servers with full lifecycle support
- **Performance**: < 100ms latency added to operations via efficient HTTP/SSE
- **Reliability**: 99% success rate for MCP operations under normal conditions, including cancellations
- **Adoption**: 50% of AI-assisted tasks utilize MCP within 3 months
- **Security**: Zero security incidents related to MCP integration; full OAuth 2.1 compliance
- **Developer Experience**: Positive feedback from team on enhanced capabilities and user approvals

## Minimal-Deviation Register (Virgil 3%)

### Changes Made
- **New Module**: Added `mcp/` directory in API package (necessary for isolation)
- **Schema Extension**: New `mcp.mts` in shared schemas (required for type safety)
- **Channel Addition**: New MCP channel handler (follows existing channel patterns)

### Preserved Patterns
- **WebSocket Architecture**: Maintains existing message flow and patterns
- **Database Usage**: Leverages existing secrets table without schema changes
- **Error Handling**: Uses established PostHog logging patterns
- **Testing Structure**: Follows existing test organization in `api/test/`
- **Configuration Flow**: Extends existing settings route without restructuring

### Why These Changes
All changes follow the minimal-deviation principle by extending rather than replacing existing systems. The MCP client is isolated in its own module to prevent contamination of core logic, while integration points use established patterns (channels, schemas, settings) to maintain familiarity for developers.

## References
- [MCP Protocol Specification](https://mcp.io/docs)
- [MCP Transports Specification (sHTTP)](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports)
- [Chassit Architecture Documentation](../README.md)
- [Original Integration Report](../../reports/mcp-client-integration.md)
- [WebSocket Implementation](../packages/api/server/ws.mts)
- [Shared Schemas](../packages/shared/src/schemas/)
- [AI Workflow Integration](../packages/api/ai/generate.mts)