#!/usr/bin/env node

import { ChassitMCPServer } from './server.mjs';

interface CLIArgs {
  transport: 'stdio' | 'http';
  port?: number;
  enableTools?: boolean;
  enableResources?: boolean;
  enablePrompts?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  config?: string;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const parsed: CLIArgs = {
    transport: 'stdio',
    enableTools: true,
    enableResources: true,
    enablePrompts: true,
    logLevel: 'info'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--transport':
        const transport = args[++i];
        if (transport === 'stdio' || transport === 'http') {
          parsed.transport = transport;
        } else {
          console.error('Invalid transport. Use "stdio" or "http"');
          process.exit(1);
        }
        break;

      case '--port':
        parsed.port = parseInt(args[++i], 10);
        if (isNaN(parsed.port)) {
          console.error('Invalid port number');
          process.exit(1);
        }
        break;

      case '--disable-tools':
        parsed.enableTools = false;
        break;

      case '--disable-resources':
        parsed.enableResources = false;
        break;

      case '--disable-prompts':
        parsed.enablePrompts = false;
        break;

      case '--log-level':
        const logLevel = args[++i];
        if (['debug', 'info', 'warn', 'error'].includes(logLevel)) {
          parsed.logLevel = logLevel as any;
        } else {
          console.error('Invalid log level. Use debug, info, warn, or error');
          process.exit(1);
        }
        break;

      case '--config':
        parsed.config = args[++i];
        break;

      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;

      default:
        if (arg.startsWith('-')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }

  return parsed;
}

function printHelp() {
  console.log(`
Chassit MCP Server

USAGE:
  chassit mcp-server [OPTIONS]

OPTIONS:
  --transport <type>     Transport type: "stdio" or "http" (default: stdio)
  --port <number>        Port for HTTP transport (default: 3000)
  --disable-tools        Disable MCP tools capability
  --disable-resources    Disable MCP resources capability
  --disable-prompts      Disable MCP prompts capability
  --log-level <level>    Log level: debug, info, warn, error (default: info)
  --config <file>        Configuration file path
  --help, -h             Show this help message

EXAMPLES:
  # Start MCP server with stdio transport (for single agent)
  chassit mcp-server --transport stdio

  # Start MCP server with HTTP transport (for multiple agents)
  chassit mcp-server --transport http --port 3000

  # Start with specific capabilities
  chassit mcp-server --disable-prompts --log-level debug

  # Development mode with verbose logging
  chassit mcp-server --transport http --port 3001 --log-level debug
`);
}

async function main() {
  const args = parseArgs();

  // Set up logging level
  if (args.logLevel === 'debug') {
    process.env.NODE_ENV = 'development';
  }

  try {
    const server = new ChassitMCPServer({
      transport: args.transport,
      port: args.port,
      enableTools: args.enableTools,
      enableResources: args.enableResources,
      enablePrompts: args.enablePrompts
    });

    // Handle graceful shutdown
    const cleanup = async () => {
      console.log('\\nShutting down Chassit MCP Server...');
      try {
        await server.stop();
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    // Start the server
    await server.start();

    if (args.transport === 'http') {
      console.log(`\\nChassit MCP Server is running on port ${args.port || 3000}`);
      console.log('Press Ctrl+C to stop the server');
    } else {
      console.log('\\nChassit MCP Server is running on stdio transport');
      console.log('Waiting for MCP client connections...');
    }

  } catch (error) {
    console.error('Failed to start Chassit MCP Server:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

export { parseArgs, main };