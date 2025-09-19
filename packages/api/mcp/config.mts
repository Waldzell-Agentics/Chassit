import type { MCPServerConfig } from './server.mjs';

// Feature flags for MCP functionality
export interface MCPFeatureFlags {
  enabled: boolean;
  server: {
    enabled: boolean;
    stdio: boolean;
    http: boolean;
  };
  client: {
    enabled: boolean;
    multiServer: boolean;
  };
  tools: {
    enabled: boolean;
    notebooks: boolean;
    cells: boolean;
    npm: boolean;
  };
  resources: {
    enabled: boolean;
    notebooks: boolean;
    cells: boolean;
    diagnostics: boolean;
  };
  prompts: {
    enabled: boolean;
    explore: boolean;
    prototype: boolean;
  };
}

// Default feature flags - start with everything disabled by default
export const DEFAULT_MCP_FLAGS: MCPFeatureFlags = {
  enabled: false,
  server: {
    enabled: false,
    stdio: false,
    http: false,
  },
  client: {
    enabled: false,
    multiServer: false,
  },
  tools: {
    enabled: false,
    notebooks: false,
    cells: false,
    npm: false,
  },
  resources: {
    enabled: false,
    notebooks: false,
    cells: false,
    diagnostics: false,
  },
  prompts: {
    enabled: false,
    explore: false,
    prototype: false,
  },
};

// MCP configuration with feature flags
export interface MCPConfig extends MCPServerConfig {
  flags: MCPFeatureFlags;
  monitoring: {
    enabled: boolean;
    metricsPort?: number;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
  security: {
    allowedOrigins?: string[];
    requireAuth: boolean;
    rateLimiting: {
      enabled: boolean;
      requestsPerMinute: number;
    };
  };
}

// Environment-based feature flag loading
export function loadMCPFlags(): MCPFeatureFlags {
  const flags = { ...DEFAULT_MCP_FLAGS };

  // Check environment variables for feature flag overrides
  if (process.env.MCP_ENABLED === 'true') {
    flags.enabled = true;
  }

  if (process.env.MCP_SERVER_ENABLED === 'true') {
    flags.server.enabled = true;
    flags.server.stdio = process.env.MCP_SERVER_STDIO !== 'false';
    flags.server.http = process.env.MCP_SERVER_HTTP === 'true';
  }

  if (process.env.MCP_CLIENT_ENABLED === 'true') {
    flags.client.enabled = true;
    flags.client.multiServer = process.env.MCP_CLIENT_MULTI_SERVER === 'true';
  }

  if (process.env.MCP_TOOLS_ENABLED === 'true') {
    flags.tools.enabled = true;
    flags.tools.notebooks = process.env.MCP_TOOLS_NOTEBOOKS !== 'false';
    flags.tools.cells = process.env.MCP_TOOLS_CELLS !== 'false';
    flags.tools.npm = process.env.MCP_TOOLS_NPM !== 'false';
  }

  if (process.env.MCP_RESOURCES_ENABLED === 'true') {
    flags.resources.enabled = true;
    flags.resources.notebooks = process.env.MCP_RESOURCES_NOTEBOOKS !== 'false';
    flags.resources.cells = process.env.MCP_RESOURCES_CELLS !== 'false';
    flags.resources.diagnostics = process.env.MCP_RESOURCES_DIAGNOSTICS !== 'false';
  }

  if (process.env.MCP_PROMPTS_ENABLED === 'true') {
    flags.prompts.enabled = true;
    flags.prompts.explore = process.env.MCP_PROMPTS_EXPLORE !== 'false';
    flags.prompts.prototype = process.env.MCP_PROMPTS_PROTOTYPE !== 'false';
  }

  return flags;
}

// Default MCP configuration
export function getDefaultMCPConfig(): MCPConfig {
  return {
    name: 'chassit',
    version: '1.0.0',
    transport: 'stdio',
    port: 3000,
    enableTools: true,
    enableResources: true,
    enablePrompts: true,
    flags: loadMCPFlags(),
    monitoring: {
      enabled: process.env.NODE_ENV === 'development',
      logLevel: (process.env.MCP_LOG_LEVEL as any) || 'info',
    },
    security: {
      allowedOrigins: process.env.MCP_ALLOWED_ORIGINS?.split(','),
      requireAuth: process.env.MCP_REQUIRE_AUTH === 'true',
      rateLimiting: {
        enabled: process.env.MCP_RATE_LIMITING === 'true',
        requestsPerMinute: parseInt(process.env.MCP_RATE_LIMIT_RPM || '60', 10),
      },
    },
  };
}

// Feature flag checker utility
export function isMCPFeatureEnabled(feature: keyof MCPFeatureFlags, flags?: MCPFeatureFlags): boolean {
  const mcpFlags = flags || loadMCPFlags();

  // Main MCP feature must be enabled first
  if (!mcpFlags.enabled) {
    return false;
  }

  return mcpFlags[feature] as boolean;
}

// Nested feature flag checker
export function isMCPSubFeatureEnabled(
  category: keyof MCPFeatureFlags,
  subFeature: string,
  flags?: MCPFeatureFlags
): boolean {
  const mcpFlags = flags || loadMCPFlags();

  // Main MCP feature must be enabled first
  if (!mcpFlags.enabled) {
    return false;
  }

  const categoryFlags = mcpFlags[category] as any;
  if (typeof categoryFlags === 'object' && categoryFlags !== null) {
    return categoryFlags.enabled && categoryFlags[subFeature];
  }

  return false;
}

// Configuration validation
export function validateMCPConfig(config: MCPConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.transport === 'http' && (!config.port || config.port < 1 || config.port > 65535)) {
    errors.push('HTTP transport requires a valid port between 1-65535');
  }

  if (config.flags.server.enabled && !config.flags.server.stdio && !config.flags.server.http) {
    errors.push('MCP server enabled but no transport methods are enabled');
  }

  if (config.monitoring.enabled && config.monitoring.metricsPort === config.port) {
    errors.push('Metrics port cannot be the same as MCP server port');
  }

  if (config.security.rateLimiting.enabled && config.security.rateLimiting.requestsPerMinute < 1) {
    errors.push('Rate limiting requests per minute must be at least 1');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}