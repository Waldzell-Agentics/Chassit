# AI Agent Notebook Adaptation Specification

## Executive Summary

This document outlines the architectural changes and feature additions needed to transform Srcbook from a human-centric TypeScript notebook into Chassit - an AI agent-optimized development and execution environment. The primary approach is to implement a Model Context Protocol (MCP) server that provides an agent-native interface to Srcbook's capabilities, enabling AI agents to programmatically explore, prototype, test, and execute complex multi-step computational tasks.

## Current State Analysis

### What Srcbook Currently Is
- **Interactive TypeScript/JavaScript notebook** with a web-based UI
- **Cell-based execution model** with markdown, code, and package.json cells
- **Local execution environment** using Node.js runtime
- **AI-assisted features** for code generation and editing (human-triggered)
- **WebSocket-based architecture** for real-time updates
- **Export format** (.src.md) for sharing and version control

### Key Components
1. **Frontend (packages/web)**: React-based UI for human interaction
2. **API Server (packages/api)**: WebSocket and HTTP server managing sessions
3. **Execution Engine**: Node/TSX-based code execution with process management
4. **TypeScript Server**: Real-time diagnostics and suggestions
5. **Session Management**: File-based storage in ~/.srcbook directory

## Model Context Protocol Integration

### Overview

The Model Context Protocol (MCP) provides a standardized way for AI agents to interact with external tools and data sources. By implementing Chassit as an MCP server, we can expose Srcbook's notebook capabilities through a well-defined protocol that AI agents can easily consume.

### MCP Architecture in Chassit Context

MCP operates on a client-host-server model:
- **Host**: The AI application (e.g., Claude, GPT) that manages client connections
- **Client**: MCP client library that maintains stateful sessions with servers
- **Server**: Chassit MCP server exposing notebook functionalities

### MCP Server Implementation

#### 1. Core MCP Features to Expose

##### 1.1 Tools
Executable functions that allow AI agents to interact with Chassit:

```typescript
interface ChassitTools {
  // Notebook Management
  'chassit.notebook.create': {
    description: 'Create a new TypeScript notebook'
    parameters: {
      name: string
      language: 'typescript' | 'javascript'
    }
  }
  
  'chassit.notebook.open': {
    description: 'Open an existing notebook session'
    parameters: {
      path?: string
      sessionId?: string
    }
  }
  
  // Cell Operations
  'chassit.cell.create': {
    description: 'Add a new cell to the notebook'
    parameters: {
      sessionId: string
      type: 'code' | 'markdown' | 'package'
      content: string
      position?: number
    }
  }
  
  'chassit.cell.execute': {
    description: 'Execute a specific cell or all cells'
    parameters: {
      sessionId: string
      cellId?: string
      executeAll?: boolean
    }
  }
  
  'chassit.cell.update': {
    description: 'Update cell content'
    parameters: {
      sessionId: string
      cellId: string
      content: string
    }
  }
  
  // Package Management
  'chassit.npm.install': {
    description: 'Install npm packages in the notebook'
    parameters: {
      sessionId: string
      packages: string[]
    }
  }
  
  // AI Features
  'chassit.ai.generate': {
    description: 'Generate code cells using AI'
    parameters: {
      sessionId: string
      prompt: string
      insertAt?: number
    }
  }
}
```

##### 1.2 Resources
Structured data and content that provides context:

```typescript
interface ChassitResources {
  'chassit://notebooks': {
    description: 'List of available notebooks and sessions'
    mimeType: 'application/json'
    schema: NotebookListSchema
  }
  
  'chassit://notebook/{sessionId}': {
    description: 'Current state of a notebook session'
    mimeType: 'application/json'
    schema: NotebookStateSchema
  }
  
  'chassit://notebook/{sessionId}/cells': {
    description: 'All cells in a notebook'
    mimeType: 'application/json'
    schema: CellArraySchema
  }
  
  'chassit://notebook/{sessionId}/output': {
    description: 'Execution outputs and logs'
    mimeType: 'text/plain'
    streaming: true
  }
  
  'chassit://diagnostics/{sessionId}': {
    description: 'TypeScript diagnostics and errors'
    mimeType: 'application/json'
    schema: DiagnosticsSchema
  }
}
```

##### 1.3 Prompts
Pre-defined templates for common notebook operations:

```typescript
interface ChassitPrompts {
  'chassit.prompt.explore': {
    description: 'Explore and analyze data'
    arguments: [
      { name: 'data_source', description: 'URL or file path to data' },
      { name: 'analysis_type', description: 'Type of analysis to perform' }
    ]
  }
  
  'chassit.prompt.prototype': {
    description: 'Create a prototype implementation'
    arguments: [
      { name: 'requirements', description: 'Feature requirements' },
      { name: 'technology', description: 'Technology stack to use' }
    ]
  }
  
  'chassit.prompt.test': {
    description: 'Generate and run tests'
    arguments: [
      { name: 'code', description: 'Code to test' },
      { name: 'test_framework', description: 'Testing framework to use' }
    ]
  }
}
```

#### 2. Transport Implementation

Chassit will support both MCP transport mechanisms:

##### 2.1 Stdio Transport
For single-client subprocess operation:
```bash
chassit mcp-server --transport stdio
```

##### 2.2 Streamable HTTP Transport
For multi-client network operation:
```bash
chassit mcp-server --transport http --port 3000
```

HTTP endpoints:
- `POST /mcp/v1/messages` - JSON-RPC message handling
- `GET /mcp/v1/sse` - Server-sent events for streaming

#### 3. JSON-RPC Message Handling

```typescript
interface MCPMessage {
  jsonrpc: '2.0'
  id?: string | number
  method?: string
  params?: any
  result?: any
  error?: {
    code: number
    message: string
    data?: any
  }
}

// Example request
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "chassit.cell.execute",
    "arguments": {
      "sessionId": "abc123",
      "cellId": "cell_1"
    }
  }
}
```

#### 4. Lifecycle Management

```typescript
interface MCPLifecycle {
  // Initialization Phase
  initialize(): Promise<{
    protocolVersion: string
    capabilities: {
      tools?: ToolsCapability
      resources?: ResourcesCapability
      prompts?: PromptsCapability
      logging?: LoggingCapability
    }
    serverInfo: {
      name: 'chassit'
      version: string
    }
  }>
  
  // Operation Phase
  handleRequest(message: MCPMessage): Promise<MCPMessage>
  
  // Shutdown Phase
  shutdown(): Promise<void>
}
```

#### 5. Security and Authorization

For HTTP transport, implement OAuth 2.1:

```typescript
interface ChassitAuth {
  // Resource server metadata
  '/.well-known/oauth-authorization-server': {
    issuer: string
    authorization_endpoint: string
    token_endpoint: string
    token_endpoint_auth_methods_supported: string[]
  }
  
  // Protected resource access
  validateToken(token: string): Promise<boolean>
  checkPermissions(token: string, resource: string): Promise<boolean>
}
```

## Proposed Adaptations for AI Agent Use

### 1. Enhanced Programmatic API Layer

Building on the MCP foundation, provide additional REST/WebSocket APIs for advanced operations:

#### 1.1 RESTful/RPC API
Create a comprehensive API that bypasses the web UI entirely:

```typescript
interface AgentAPI {
  // Session Management
  createSession(options: SessionOptions): Promise<SessionHandle>
  loadSession(id: string): Promise<SessionHandle>
  deleteSession(id: string): Promise<void>
  listSessions(): Promise<SessionInfo[]>
  
  // Cell Operations
  addCell(sessionId: string, cell: CellInput): Promise<Cell>
  updateCell(sessionId: string, cellId: string, updates: CellUpdate): Promise<Cell>
  executeCell(sessionId: string, cellId: string): Promise<ExecutionResult>
  executeCellsInSequence(sessionId: string, cellIds: string[]): AsyncIterator<ExecutionResult>
  deleteCell(sessionId: string, cellId: string): Promise<void>
  
  // Batch Operations
  executeNotebook(sessionId: string): AsyncIterator<ExecutionEvent>
  validateNotebook(sessionId: string): Promise<ValidationResult>
  
  // Environment Management
  installDependencies(sessionId: string, packages: string[]): Promise<InstallResult>
  setEnvironmentVariables(sessionId: string, vars: Record<string, string>): Promise<void>
  
  // Export/Import
  exportToSrcmd(sessionId: string): Promise<string>
  importFromSrcmd(srcmd: string): Promise<SessionHandle>
  exportToExecutableProject(sessionId: string): Promise<ProjectBundle>
}
```

#### 1.2 Streaming Execution API
Support for long-running operations with streaming results:

```typescript
interface StreamingAPI {
  executeStream(sessionId: string, cellId: string): ReadableStream<ExecutionChunk>
  watchDiagnostics(sessionId: string): ReadableStream<DiagnosticEvent>
  subscribeToLogs(sessionId: string, cellId?: string): ReadableStream<LogEntry>
}
```

### 2. Execution Environment Enhancements

#### 2.1 Sandboxing and Resource Management
- **Container/VM isolation** options for untrusted code execution
- **Resource limits** (CPU, memory, execution time, network)
- **Parallel execution** support for independent cells
- **Execution priority** and queueing system

```typescript
interface ExecutionConfig {
  isolation: 'none' | 'container' | 'vm'
  resources: {
    maxMemoryMB: number
    maxCPUPercent: number
    maxExecutionTimeMs: number
    networkAccess: boolean
    fileSystemAccess: 'none' | 'readonly' | 'readwrite'
  }
  parallel: boolean
  priority: 'low' | 'normal' | 'high'
}
```

#### 2.2 State Management
- **Persistent variable storage** between cell executions
- **State snapshots** and rollback capabilities
- **Shared memory** between cells for large data structures

```typescript
interface StateManager {
  saveState(sessionId: string, key: string, value: any): Promise<void>
  loadState(sessionId: string, key: string): Promise<any>
  createSnapshot(sessionId: string): Promise<SnapshotId>
  restoreSnapshot(sessionId: string, snapshotId: SnapshotId): Promise<void>
  clearState(sessionId: string): Promise<void>
}
```

### 3. Agent-Specific Cell Types

#### 3.1 Tool Definition Cells
Allow agents to define and use custom tools:

```typescript
interface ToolCell {
  type: 'tool'
  name: string
  description: string
  parameters: JSONSchema
  implementation: string // TypeScript function code
  timeout?: number
}
```

#### 3.2 Test Cells
Built-in testing framework integration:

```typescript
interface TestCell {
  type: 'test'
  name: string
  setup?: string
  test: string
  teardown?: string
  assertions: Assertion[]
}
```

#### 3.3 Data Cells
Structured data storage and manipulation:

```typescript
interface DataCell {
  type: 'data'
  format: 'json' | 'csv' | 'parquet' | 'arrow'
  source: 'inline' | 'file' | 'url' | 'query'
  data?: any
  schema?: JSONSchema
  transformations?: DataTransformation[]
}
```

### 4. Enhanced Introspection and Debugging

#### 4.1 Execution Tracing
- **Step-by-step execution** logs with variable states
- **Performance profiling** per cell and line
- **Memory usage** tracking
- **Dependency graph** visualization

```typescript
interface ExecutionTrace {
  cellId: string
  startTime: number
  endTime: number
  memoryUsage: MemorySnapshot[]
  variables: VariableSnapshot[]
  callStack: CallFrame[]
  errors: Error[]
  warnings: Warning[]
}
```

#### 4.2 Intelligent Error Recovery
- **Automatic error categorization** (syntax, runtime, logic, resource)
- **Suggested fixes** based on error patterns
- **Retry mechanisms** with exponential backoff
- **Fallback strategies** for common failure modes

### 5. Inter-Agent Collaboration Features

#### 5.1 Shared Sessions
Multiple agents working on the same notebook:

```typescript
interface CollaborativeSession {
  id: string
  agents: AgentInfo[]
  locks: CellLock[]
  conflictResolution: 'last-write-wins' | 'merge' | 'manual'
  broadcastChanges(change: CellChange): Promise<void>
  acquireLock(cellId: string, agentId: string): Promise<LockToken>
  releaseLock(lockToken: LockToken): Promise<void>
}
```

#### 5.2 Message Passing
Direct communication between cells/agents:

```typescript
interface MessageBus {
  send(from: CellId, to: CellId, message: any): Promise<void>
  subscribe(cellId: CellId, handler: MessageHandler): Unsubscribe
  broadcast(message: any): Promise<void>
}
```

### 6. Advanced Package Management

#### 6.1 Intelligent Dependency Resolution
- **Automatic package suggestion** based on imports
- **Version conflict resolution**
- **Security vulnerability scanning**
- **License compatibility checking**

```typescript
interface SmartPackageManager {
  suggestPackages(code: string): Promise<PackageSuggestion[]>
  resolveConflicts(packages: PackageRequirement[]): Promise<Resolution>
  scanVulnerabilities(packages: Package[]): Promise<VulnerabilityReport>
  checkLicenses(packages: Package[]): Promise<LicenseReport>
  installOptimal(requirements: string[]): Promise<InstallResult>
}
```

### 7. Output and Artifact Management

#### 7.1 Structured Output Collection
- **Typed output channels** (stdout, stderr, return values, files)
- **Output aggregation** across multiple cells
- **Format conversion** (JSON, CSV, Markdown, HTML)

```typescript
interface OutputCollector {
  capture(cellId: string, type: OutputType, data: any): void
  aggregate(cellIds: string[]): AggregatedOutput
  transform(output: Output, format: OutputFormat): TransformedOutput
  persist(output: Output, destination: OutputDestination): Promise<void>
}
```

#### 7.2 Artifact Generation
- **Automatic documentation** generation
- **Code bundling** for deployment
- **Report generation** with charts and tables

### 8. Monitoring and Observability

#### 8.1 Metrics Collection
```typescript
interface MetricsCollector {
  recordExecution(metrics: ExecutionMetrics): void
  recordError(error: ErrorMetrics): void
  recordResourceUsage(usage: ResourceMetrics): void
  getStatistics(sessionId: string): SessionStatistics
  exportMetrics(format: 'prometheus' | 'json'): string
}
```

#### 8.2 Logging Infrastructure
- **Structured logging** with log levels
- **Log aggregation** and searching
- **Real-time log streaming**
- **Log retention policies**

### 9. Security Enhancements

#### 9.1 Authentication and Authorization
```typescript
interface SecurityManager {
  authenticateAgent(credentials: AgentCredentials): Promise<AgentToken>
  authorizeAction(token: AgentToken, action: Action): Promise<boolean>
  createApiKey(agentId: string, permissions: Permission[]): Promise<ApiKey>
  revokeApiKey(apiKey: string): Promise<void>
}
```

#### 9.2 Audit Logging
- **Complete action history** with timestamps
- **Change tracking** with diffs
- **Agent attribution** for all operations

### 10. Integration Capabilities

#### 10.1 External Tool Integration
```typescript
interface ToolIntegration {
  // Database connections
  connectDatabase(config: DatabaseConfig): Promise<DatabaseConnection>
  
  // API integrations
  callAPI(endpoint: string, options: RequestOptions): Promise<Response>
  
  // File system operations
  readFile(path: string): Promise<Buffer>
  writeFile(path: string, data: Buffer): Promise<void>
  
  // Cloud services
  uploadToS3(bucket: string, key: string, data: Buffer): Promise<void>
  invokeFunction(service: 'lambda' | 'functions', name: string, payload: any): Promise<any>
}
```

#### 10.2 Webhook Support
- **Incoming webhooks** to trigger notebook execution
- **Outgoing webhooks** for completion notifications
- **Event subscriptions** for real-time updates

## Implementation Priorities

### Phase 1: MCP Server Foundation (Weeks 1-3)
1. Basic MCP server implementation with stdio transport
2. Core tools exposure (notebook create, open, cell operations)
3. JSON-RPC message handling
4. Capability negotiation and lifecycle management

### Phase 2: MCP Features (Weeks 4-6)
1. Resource exposure (notebook state, cells, outputs)
2. Streaming support for real-time outputs
3. Prompts implementation for common workflows
4. HTTP transport with SSE support

### Phase 3: Enhanced MCP Integration (Weeks 7-9)
1. OAuth 2.1 authorization for HTTP transport
2. Resource subscriptions for state changes
3. Advanced tool implementations (AI generation, package management)
4. Error handling and recovery mechanisms

### Phase 4: Core API Extensions (Weeks 10-12)
1. RESTful API for operations not covered by MCP
2. WebSocket support for real-time updates
3. Batch operations and parallel execution
4. State persistence and snapshots

### Phase 5: Agent-Specific Features (Weeks 13-16)
1. Tool cells for custom function definitions
2. Test cells with assertion frameworks
3. Enhanced introspection and debugging
4. Multi-agent session support

### Phase 6: Advanced Capabilities (Weeks 17-20)
1. Smart package management with vulnerability scanning
2. External integrations (databases, APIs, cloud services)
3. Monitoring, metrics, and observability
4. Webhook support for event-driven workflows

## Success Metrics

### Performance Metrics
- **API response time** < 100ms for basic operations
- **Cell execution overhead** < 10ms
- **Concurrent session support** > 100 sessions
- **Memory efficiency** < 50MB per idle session

### Reliability Metrics
- **API availability** > 99.9%
- **Execution success rate** > 95%
- **Error recovery rate** > 80%
- **Data durability** 100%

### Usability Metrics
- **API adoption rate** by AI agents
- **Average time to first successful execution**
- **Error message clarity** score
- **Documentation completeness** score

## Migration Strategy

### MCP Integration Approach
- **Parallel Development**: Implement MCP server alongside existing Srcbook functionality
- **Non-Breaking Changes**: MCP server runs as optional component
- **Progressive Enhancement**: Gradually expose more features through MCP
- **Testing Strategy**: Validate MCP operations against existing API

### Backward Compatibility
- Maintain existing web UI functionality
- Support current .src.md format
- Preserve existing session structure
- CLI commands remain unchanged
- MCP server activated via opt-in flag

### Data Migration
- Automated conversion of existing notebooks
- Session state preservation
- Configuration migration tools
- Rollback capabilities

### MCP Client Testing
Develop test clients to validate MCP server:
1. Simple stdio client for basic operations
2. HTTP client with streaming support
3. Integration tests with popular AI frameworks
4. Performance benchmarks for MCP vs direct API

## Conclusion

Transforming Srcbook into Chassit through Model Context Protocol integration provides a standardized, agent-native interface while preserving the tool's core strengths. The MCP server approach offers several key advantages:

1. **Standardization**: Leverages an established protocol that AI agents already understand
2. **Interoperability**: Compatible with any MCP-compliant AI system
3. **Flexibility**: Supports both subprocess (stdio) and network (HTTP) deployment models
4. **Security**: Built-in authorization framework for secure multi-tenant operation
5. **Extensibility**: Easy to add new tools, resources, and prompts as capabilities expand

The phased implementation prioritizes MCP server development first, establishing a solid foundation for agent interaction before adding advanced features. This approach ensures rapid time-to-value while maintaining architectural flexibility for future enhancements.

By combining MCP's standardized protocol with Srcbook's powerful notebook execution engine, Chassit will provide AI agents with an intuitive, reliable, and feature-rich environment for exploring, prototyping, and executing complex computational tasks autonomously.

## Appendix: MCP Server CLI Interface

```bash
# Start MCP server with stdio transport (for single agent)
chassit mcp-server --transport stdio

# Start MCP server with HTTP transport (for multiple agents)
chassit mcp-server --transport http --port 3000 --auth oauth

# Start with specific capabilities
chassit mcp-server --enable-tools --enable-resources --enable-prompts

# Development mode with verbose logging
chassit mcp-server --dev --log-level debug

# Configuration file support
chassit mcp-server --config mcp-config.json
```

## References

- [Model Context Protocol Specification](https://modelcontextprotocol.io/specification/2025-06-18)
- [MCP Architecture Overview](https://modelcontextprotocol.io/specification/2025-06-18/architecture)
- [MCP Transport Mechanisms](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports)
- [MCP Server Implementation Guide](https://modelcontextprotocol.io/specification/2025-06-18/server)
- [MCP Authorization Framework](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)