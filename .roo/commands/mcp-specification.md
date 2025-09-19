# MODEL CONTEXT PROTOCOL (MCP) SPECIFICATION REFERENCE

Hi, friend. You are Claude Code, an agentic coding assistant with comprehensive knowledge of the Model Context Protocol (MCP). This reference provides complete documentation for utilizing MCP's capabilities to connect AI applications with data sources and tools.

## VARIABLES

CONTEXT: MCP Specification v2025-06-18

### Documentation URLs

MCP_MAIN_SITE: https://modelcontextprotocol.io/
MCP_SPECIFICATION: https://modelcontextprotocol.io/specification/2025-06-18/
MCP_GETTING_STARTED: https://modelcontextprotocol.io/docs/getting-started/intro
MCP_ARCHITECTURE: https://modelcontextprotocol.io/docs/learn/architecture

#### Core Documentation
MCP_CLIENT_CONCEPTS: https://modelcontextprotocol.io/docs/learn/client-concepts
MCP_SERVER_CONCEPTS: https://modelcontextprotocol.io/docs/learn/server-concepts
MCP_SDK_DOCS: https://modelcontextprotocol.io/docs/sdk
MCP_QUICKSTART_CLIENT: https://modelcontextprotocol.io/quickstart/client
MCP_QUICKSTART_SERVER: https://modelcontextprotocol.io/quickstart/server
MCP_QUICKSTART_USER: https://modelcontextprotocol.io/quickstart/user

#### Specification Sections
MCP_SPEC_ARCHITECTURE: https://modelcontextprotocol.io/specification/2025-06-18/architecture/
MCP_SPEC_AUTHORIZATION: https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization
MCP_SPEC_LIFECYCLE: https://modelcontextprotocol.io/specification/2025-06-18/basic/lifecycle
MCP_SPEC_TRANSPORTS: https://modelcontextprotocol.io/specification/2025-06-18/basic/transports
MCP_SPEC_SECURITY: https://modelcontextprotocol.io/specification/2025-06-18/basic/security_best_practices

#### Server Features
MCP_SPEC_PROMPTS: https://modelcontextprotocol.io/specification/2025-06-18/server/prompts
MCP_SPEC_RESOURCES: https://modelcontextprotocol.io/specification/2025-06-18/server/resources
MCP_SPEC_TOOLS: https://modelcontextprotocol.io/specification/2025-06-18/server/tools
MCP_SPEC_COMPLETION: https://modelcontextprotocol.io/specification/2025-06-18/server/utilities/completion
MCP_SPEC_LOGGING: https://modelcontextprotocol.io/specification/2025-06-18/server/utilities/logging
MCP_SPEC_PAGINATION: https://modelcontextprotocol.io/specification/2025-06-18/server/utilities/pagination

#### Client Features  
MCP_SPEC_ELICITATION: https://modelcontextprotocol.io/specification/2025-06-18/client/elicitation
MCP_SPEC_ROOTS: https://modelcontextprotocol.io/specification/2025-06-18/client/roots
MCP_SPEC_SAMPLING: https://modelcontextprotocol.io/specification/2025-06-18/client/sampling

#### Protocol Utilities
MCP_SPEC_CANCELLATION: https://modelcontextprotocol.io/specification/2025-06-18/basic/utilities/cancellation
MCP_SPEC_PING: https://modelcontextprotocol.io/specification/2025-06-18/basic/utilities/ping
MCP_SPEC_PROGRESS: https://modelcontextprotocol.io/specification/2025-06-18/basic/utilities/progress

#### Schema Reference
MCP_SCHEMA_REFERENCE: https://modelcontextprotocol.io/specification/2025-06-18/schema
MCP_SPEC_VERSIONING: https://modelcontextprotocol.io/specification/versioning
MCP_SPEC_CHANGELOG: https://modelcontextprotocol.io/specification/2025-06-18/changelog

#### Community & Governance
MCP_COMMUNITY: https://modelcontextprotocol.io/community/communication
MCP_GOVERNANCE: https://modelcontextprotocol.io/community/governance
MCP_SEP_GUIDELINES: https://modelcontextprotocol.io/community/sep-guidelines
MCP_ROADMAP: https://modelcontextprotocol.io/development/roadmap

#### GitHub Resources
MCP_GITHUB_MAIN: https://github.com/modelcontextprotocol/modelcontextprotocol
MCP_GITHUB_SERVERS: https://github.com/modelcontextprotocol/servers
MCP_GITHUB_DISCUSSIONS: https://github.com/modelcontextprotocol/modelcontextprotocol/discussions
MCP_DISCORD: https://discord.gg/6CSzBmMkjX

### SDK Repositories
MCP_SDK_TYPESCRIPT: https://github.com/modelcontextprotocol/typescript-sdk
MCP_SDK_PYTHON: https://github.com/modelcontextprotocol/python-sdk
MCP_SDK_GO: https://github.com/modelcontextprotocol/go-sdk
MCP_SDK_KOTLIN: https://github.com/modelcontextprotocol/kotlin-sdk
MCP_SDK_SWIFT: https://github.com/modelcontextprotocol/swift-sdk
MCP_SDK_JAVA: https://github.com/modelcontextprotocol/java-sdk
MCP_SDK_CSHARP: https://github.com/modelcontextprotocol/csharp-sdk
MCP_SDK_RUBY: https://github.com/modelcontextprotocol/ruby-sdk
MCP_SDK_RUST: https://github.com/modelcontextprotocol/rust-sdk

## YOUR MCP CAPABILITIES

### Core Protocol for AI Context Exchange

The Model Context Protocol (MCP) is an open protocol that standardizes how AI applications connect to data sources and tools, providing:

- **Universal Connectivity**: Like USB-C for AI - connect any AI app to any data source
- **Ecosystem Scale**: 1000+ servers, 70+ clients, 9 official SDKs
- **Protocol Standards**: JSON-RPC 2.0 based with OAuth 2.1 authorization
- **Progressive Enhancement**: Capability-based feature negotiation
- **Security First**: User approval for all actions, token validation, secure transports

### Architecture Components

**1. MCP Host**
- Container and coordinator for client instances
- Manages AI/LLM integration and sampling
- Enforces security policies and user consent
- Aggregates context across multiple servers

**2. MCP Client**
- One-to-one connection with MCP server
- Handles protocol negotiation and message routing
- Manages subscriptions and notifications
- Maintains security boundaries

**3. MCP Server**
- Provides tools, resources, and prompts
- Can be local (stdio) or remote (HTTP)
- Operates independently with focused responsibilities
- Respects security constraints

### Server Primitives

**Tools - AI Actions**
- Schema-defined functions that LLMs can invoke
- Require explicit user approval before execution
- Support structured input/output with JSON Schema
- Operations: `tools/list`, `tools/call`

**Resources - Context Data**
- URI-based content identification (file://, https://, custom://)
- MIME type declarations for content handling
- Support for templates with parameterized URIs
- Operations: `resources/list`, `resources/read`, `resources/subscribe`

**Prompts - Interaction Templates**
- Reusable templates for structured interactions
- Support for arguments and dynamic content
- User-controlled invocation
- Operations: `prompts/list`, `prompts/get`

### Client Features

**Sampling - LLM Interaction**
- Request language model completions through the client
- Model preference abstraction (cost, speed, intelligence priorities)
- Human-in-the-loop approval for requests and responses
- Isolated from main conversation context

**Roots - Filesystem Boundaries**
- Define operational directories for servers
- File URI format (file:///path/to/directory)
- Client maintains full control of actual access
- Change notifications via `notifications/roots/list_changed`

**Elicitation - User Input**
- Request additional information during interactions
- Support for structured data with JSON Schema
- User can accept, decline, or cancel requests
- Limited to flat objects with primitive types

### Transport Mechanisms

**stdio Transport**
- Local process communication via standard input/output
- JSON-RPC messages delimited by newlines
- Server reads from stdin, writes to stdout
- Logging via stderr only

**Streamable HTTP Transport**
- HTTP POST for client-to-server messages
- Optional Server-Sent Events for server-to-client
- Session management with Mcp-Session-Id header
- Support for authorization headers

**Custom Transports**
- Must preserve JSON-RPC message format
- Must maintain lifecycle requirements
- Should document connection patterns

### Protocol Features

**Lifecycle Management**
1. **Initialization**: Version and capability negotiation
2. **Operation**: Normal message exchange
3. **Shutdown**: Graceful termination

**Message Types**
- **Requests**: Include ID, expect response
- **Responses**: Match request ID, contain result or error
- **Notifications**: No ID, no response expected

**Utility Features**
- **Cancellation**: Cancel in-progress requests
- **Ping**: Connection health verification
- **Progress**: Track long-running operations

### Security & Authorization

**OAuth 2.1 Compliance**
- Full OAuth 2.1 specification support
- Protected Resource Metadata discovery
- Dynamic Client Registration
- PKCE requirement for all flows

**Token Management**
- Authorization header usage (never in query strings)
- Audience binding validation
- Short-lived access tokens
- Secure token storage

**User Protection**
- Explicit approval for all tool executions
- Human-in-the-loop checkpoints
- Session isolation between servers
- Origin validation for HTTP transport

### SDK Support

**Official SDKs (9 Languages)**
- TypeScript, Python, Go, Kotlin, Swift
- Java, C#, Ruby, Rust
- All SDKs provide identical functionality
- Language-idiomatic implementations

**SDK Capabilities**
- Create MCP servers with tools, resources, prompts
- Build MCP clients connecting to any server
- Support for local (stdio) and remote (HTTP) transports
- Full protocol compliance with type safety

### Client Ecosystem

**71+ Compatible Clients**

**Feature Support Matrix**
- Tools: 70/71 clients (near universal)
- Resources: 21/71 clients
- Prompts: 21/71 clients  
- Sampling: 7/71 clients
- Roots: 4/71 clients
- Elicitation: 3/71 clients

**Notable Clients**
- Claude Desktop App & Claude Code
- VS Code GitHub Copilot
- Amazon Q (IDE & CLI)
- ChatGPT
- Cursor, Cline, Continue
- 60+ additional implementations

**Client Categories**
- IDE Extensions (VS Code, JetBrains, etc.)
- Desktop Applications (Claude, BoltAI, etc.)
- CLI Tools (Amazon Q CLI, oterm, etc.)
- Web Platforms (Claude.ai, ChatGPT, etc.)
- AI Frameworks (AgentAI, BeeAI, etc.)

### Server Examples

**Reference Implementations**
- Everything: Test server with all primitives
- Filesystem: Secure file operations
- Git: Repository manipulation
- Memory: Knowledge graph persistence
- Sequential Thinking: Problem-solving patterns
- Fetch: Web content retrieval
- Time: Timezone conversions

**Installation Methods**
```bash
# TypeScript servers
npx -y @modelcontextprotocol/server-memory

# Python servers (uvx)
uvx mcp-server-git

# Python servers (pip)
pip install mcp-server-git
python -m mcp_server_git
```

### Configuration Example

**Claude Desktop Configuration**
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/files"]
    },
    "github": {
      "command": "npx", 
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<YOUR_TOKEN>"
      }
    }
  }
}
```

Location:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

### Development Roadmap

**Current Priorities (Next 6 Months)**

1. **Agentic Workflows**
   - Asynchronous long-running operations
   - Resilient disconnection handling

2. **Security & Authorization**
   - Enhanced security guides
   - DCR alternatives
   - Fine-grained authorization
   - Enterprise SSO integration

3. **Validation & Testing**
   - Reference implementations
   - Compliance test suites
   - Automated verification

4. **Registry & Discovery**
   - Centralized MCP Registry
   - Server metadata API

5. **Multimodality**
   - Video support
   - Streaming and bidirectional communication
   - Additional media types

### Community & Governance

**Communication Channels**
- Discord: Real-time contributor discussion
- GitHub Discussions: Project planning and announcements
- GitHub Issues: Bug reports and feature tracking

**Governance Structure**
- Lead Maintainers (BDFL): Final decision authority
- Core Maintainers: Drive project direction
- Maintainers: Component ownership
- Contributors: Community participation

**SEP Process**
- Specification Enhancement Proposals for major changes
- GitHub Issue-based workflow
- Core maintainer sponsorship required
- Community feedback integration

### Quick Reference

**Common Patterns**
```javascript
// Initialize client
const client = new Client(session, transport);

// List available tools
const tools = await client.listTools();

// Execute tool with user approval
const result = await client.callTool(name, args);

// Read resource content
const content = await client.readResource(uri);

// Get prompt template
const prompt = await client.getPrompt(name, args);
```

**Error Handling**
- JSON-RPC error codes for protocol errors
- Tool execution errors in result
- Transport-specific error handling
- Graceful degradation for missing capabilities

**Best Practices**
- Always validate capabilities before use
- Implement proper error handling
- Use progress tracking for long operations
- Respect user approval requirements
- Maintain security boundaries

## Implementation Guidelines

1. **Start Simple**: Begin with basic tools/resources
2. **Progressive Enhancement**: Add features incrementally
3. **Security First**: Always require user approval
4. **Error Resilience**: Handle failures gracefully
5. **Documentation**: Provide clear descriptions
6. **Testing**: Use Inspector tool for debugging
7. **Community**: Share servers and contribute

## Summary

MCP provides a standardized, secure, and scalable protocol for connecting AI applications to data sources and tools. With extensive client and server support, comprehensive SDKs, and a growing ecosystem, MCP enables powerful AI integrations while maintaining user control and security.

For detailed implementation guidance, consult the official documentation at https://modelcontextprotocol.io/