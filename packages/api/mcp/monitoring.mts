import type { MCPConfig } from './config.mjs';

// Metrics collection interface
export interface MCPMetrics {
  // Request metrics
  requests: {
    total: number;
    success: number;
    error: number;
    byMethod: Record<string, number>;
  };

  // Performance metrics
  performance: {
    avgResponseTime: number;
    p95ResponseTime: number;
    maxResponseTime: number;
    minResponseTime: number;
  };

  // Connection metrics
  connections: {
    active: number;
    total: number;
    failed: number;
  };

  // Tool execution metrics
  tools: {
    executions: number;
    failures: number;
    avgExecutionTime: number;
    byTool: Record<string, { count: number; avgTime: number }>;
  };

  // Resource access metrics
  resources: {
    reads: number;
    failures: number;
    avgReadTime: number;
    byResource: Record<string, number>;
  };
}

// Event types for monitoring
export type MCPEvent =
  | { type: 'request.received'; method: string; timestamp: number }
  | { type: 'request.completed'; method: string; duration: number; success: boolean; timestamp: number }
  | { type: 'connection.opened'; transport: string; timestamp: number }
  | { type: 'connection.closed'; transport: string; duration: number; timestamp: number }
  | { type: 'tool.executed'; tool: string; duration: number; success: boolean; timestamp: number }
  | { type: 'resource.read'; uri: string; duration: number; success: boolean; timestamp: number }
  | { type: 'error.occurred'; error: string; method?: string; severity: 'low' | 'medium' | 'high'; timestamp: number };

// Simple in-memory metrics collector
export class MCPMonitor {
  private metrics: MCPMetrics;
  private config: MCPConfig;
  private events: MCPEvent[] = [];
  private responseTimeBuffer: number[] = [];
  private readonly BUFFER_SIZE = 100;

  constructor(config: MCPConfig) {
    this.config = config;
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        error: 0,
        byMethod: {},
      },
      performance: {
        avgResponseTime: 0,
        p95ResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: Number.MAX_SAFE_INTEGER,
      },
      connections: {
        active: 0,
        total: 0,
        failed: 0,
      },
      tools: {
        executions: 0,
        failures: 0,
        avgExecutionTime: 0,
        byTool: {},
      },
      resources: {
        reads: 0,
        failures: 0,
        avgReadTime: 0,
        byResource: {},
      },
    };
  }

  // Record an event
  recordEvent(event: MCPEvent): void {
    if (!this.config.monitoring.enabled) return;

    this.events.push(event);

    // Keep only recent events (last 1000)
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }

    this.updateMetrics(event);
    this.logEvent(event);
  }

  private updateMetrics(event: MCPEvent): void {
    switch (event.type) {
      case 'request.received':
        this.metrics.requests.total++;
        this.metrics.requests.byMethod[event.method] = (this.metrics.requests.byMethod[event.method] || 0) + 1;
        break;

      case 'request.completed':
        if (event.success) {
          this.metrics.requests.success++;
        } else {
          this.metrics.requests.error++;
        }
        this.updateResponseTimes(event.duration);
        break;

      case 'connection.opened':
        this.metrics.connections.active++;
        this.metrics.connections.total++;
        break;

      case 'connection.closed':
        this.metrics.connections.active = Math.max(0, this.metrics.connections.active - 1);
        break;

      case 'tool.executed':
        this.metrics.tools.executions++;
        if (!event.success) {
          this.metrics.tools.failures++;
        }

        if (!this.metrics.tools.byTool[event.tool]) {
          this.metrics.tools.byTool[event.tool] = { count: 0, avgTime: 0 };
        }

        const toolStats = this.metrics.tools.byTool[event.tool];
        const newCount = toolStats.count + 1;
        toolStats.avgTime = (toolStats.avgTime * toolStats.count + event.duration) / newCount;
        toolStats.count = newCount;

        // Update overall average
        this.metrics.tools.avgExecutionTime =
          (this.metrics.tools.avgExecutionTime * (this.metrics.tools.executions - 1) + event.duration) /
          this.metrics.tools.executions;
        break;

      case 'resource.read':
        this.metrics.resources.reads++;
        if (!event.success) {
          this.metrics.resources.failures++;
        }

        this.metrics.resources.byResource[event.uri] = (this.metrics.resources.byResource[event.uri] || 0) + 1;

        // Update average read time
        this.metrics.resources.avgReadTime =
          (this.metrics.resources.avgReadTime * (this.metrics.resources.reads - 1) + event.duration) /
          this.metrics.resources.reads;
        break;
    }
  }

  private updateResponseTimes(duration: number): void {
    this.responseTimeBuffer.push(duration);

    if (this.responseTimeBuffer.length > this.BUFFER_SIZE) {
      this.responseTimeBuffer.shift();
    }

    // Update performance metrics
    this.metrics.performance.maxResponseTime = Math.max(this.metrics.performance.maxResponseTime, duration);
    this.metrics.performance.minResponseTime = Math.min(this.metrics.performance.minResponseTime, duration);

    // Calculate average
    this.metrics.performance.avgResponseTime =
      this.responseTimeBuffer.reduce((sum, time) => sum + time, 0) / this.responseTimeBuffer.length;

    // Calculate P95
    if (this.responseTimeBuffer.length > 0) {
      const sorted = [...this.responseTimeBuffer].sort((a, b) => a - b);
      const p95Index = Math.floor(sorted.length * 0.95);
      this.metrics.performance.p95ResponseTime = sorted[p95Index] || 0;
    }
  }

  private logEvent(event: MCPEvent): void {
    const logLevel = this.config.monitoring.logLevel;

    // Only log based on configured level
    const shouldLog = logLevel === 'debug' ||
                     (logLevel === 'info' && ['connection.opened', 'connection.closed', 'error.occurred'].includes(event.type)) ||
                     (logLevel === 'warn' && event.type === 'error.occurred' && event.severity !== 'low') ||
                     (logLevel === 'error' && event.type === 'error.occurred' && event.severity === 'high');

    if (shouldLog) {
      const message = this.formatLogMessage(event);
      console.log(`[MCP Monitor] ${message}`);
    }
  }

  private formatLogMessage(event: MCPEvent): string {
    const timestamp = new Date(event.timestamp).toISOString();

    switch (event.type) {
      case 'request.received':
        return `${timestamp} - Request received: ${event.method}`;

      case 'request.completed':
        return `${timestamp} - Request completed: ${event.method}, ${event.duration}ms, ${event.success ? 'success' : 'error'}`;

      case 'connection.opened':
        return `${timestamp} - Connection opened: ${event.transport}`;

      case 'connection.closed':
        return `${timestamp} - Connection closed: ${event.transport}, duration: ${event.duration}ms`;

      case 'tool.executed':
        return `${timestamp} - Tool executed: ${event.tool}, ${event.duration}ms, ${event.success ? 'success' : 'error'}`;

      case 'resource.read':
        return `${timestamp} - Resource read: ${event.uri}, ${event.duration}ms, ${event.success ? 'success' : 'error'}`;

      case 'error.occurred':
        return `${timestamp} - Error [${event.severity}]: ${event.error} ${event.method ? `(${event.method})` : ''}`;

      default:
        return `${timestamp} - Unknown event: ${JSON.stringify(event)}`;
    }
  }

  // Get current metrics
  getMetrics(): MCPMetrics {
    return { ...this.metrics };
  }

  // Get recent events
  getEvents(limit = 100): MCPEvent[] {
    return this.events.slice(-limit);
  }

  // Get health status
  getHealthStatus(): { status: 'healthy' | 'warning' | 'critical'; issues: string[] } {
    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check error rate
    const errorRate = this.metrics.requests.total > 0 ?
      (this.metrics.requests.error / this.metrics.requests.total) : 0;

    if (errorRate > 0.1) { // 10% error rate
      issues.push(`High error rate: ${(errorRate * 100).toFixed(1)}%`);
      status = 'critical';
    } else if (errorRate > 0.05) { // 5% error rate
      issues.push(`Elevated error rate: ${(errorRate * 100).toFixed(1)}%`);
      if (status === 'healthy') status = 'warning';
    }

    // Check response time
    if (this.metrics.performance.p95ResponseTime > 1000) { // 1 second
      issues.push(`High P95 response time: ${this.metrics.performance.p95ResponseTime}ms`);
      status = 'critical';
    } else if (this.metrics.performance.p95ResponseTime > 500) { // 500ms
      issues.push(`Elevated P95 response time: ${this.metrics.performance.p95ResponseTime}ms`);
      if (status === 'healthy') status = 'warning';
    }

    // Check connection failures
    const connectionFailureRate = this.metrics.connections.total > 0 ?
      (this.metrics.connections.failed / this.metrics.connections.total) : 0;

    if (connectionFailureRate > 0.2) { // 20% connection failure rate
      issues.push(`High connection failure rate: ${(connectionFailureRate * 100).toFixed(1)}%`);
      status = 'critical';
    }

    return { status, issues };
  }

  // Export metrics in Prometheus format
  exportPrometheusMetrics(): string {
    const metrics = this.getMetrics();

    return [
      `# HELP mcp_requests_total Total number of MCP requests`,
      `# TYPE mcp_requests_total counter`,
      `mcp_requests_total ${metrics.requests.total}`,
      ``,
      `# HELP mcp_requests_success_total Total number of successful MCP requests`,
      `# TYPE mcp_requests_success_total counter`,
      `mcp_requests_success_total ${metrics.requests.success}`,
      ``,
      `# HELP mcp_requests_error_total Total number of failed MCP requests`,
      `# TYPE mcp_requests_error_total counter`,
      `mcp_requests_error_total ${metrics.requests.error}`,
      ``,
      `# HELP mcp_response_time_ms Response time in milliseconds`,
      `# TYPE mcp_response_time_ms histogram`,
      `mcp_response_time_ms_avg ${metrics.performance.avgResponseTime}`,
      `mcp_response_time_ms_p95 ${metrics.performance.p95ResponseTime}`,
      `mcp_response_time_ms_max ${metrics.performance.maxResponseTime}`,
      ``,
      `# HELP mcp_connections_active Current number of active connections`,
      `# TYPE mcp_connections_active gauge`,
      `mcp_connections_active ${metrics.connections.active}`,
      ``,
      `# HELP mcp_tools_executions_total Total number of tool executions`,
      `# TYPE mcp_tools_executions_total counter`,
      `mcp_tools_executions_total ${metrics.tools.executions}`,
      ``,
      `# HELP mcp_resources_reads_total Total number of resource reads`,
      `# TYPE mcp_resources_reads_total counter`,
      `mcp_resources_reads_total ${metrics.resources.reads}`,
    ].join('\n');
  }

  // Reset metrics (useful for testing)
  reset(): void {
    this.metrics = {
      requests: { total: 0, success: 0, error: 0, byMethod: {} },
      performance: { avgResponseTime: 0, p95ResponseTime: 0, maxResponseTime: 0, minResponseTime: Number.MAX_SAFE_INTEGER },
      connections: { active: 0, total: 0, failed: 0 },
      tools: { executions: 0, failures: 0, avgExecutionTime: 0, byTool: {} },
      resources: { reads: 0, failures: 0, avgReadTime: 0, byResource: {} },
    };
    this.events = [];
    this.responseTimeBuffer = [];
  }
}