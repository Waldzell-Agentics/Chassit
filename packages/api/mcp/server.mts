import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { Tool, Resource, Prompt } from '@modelcontextprotocol/sdk/types.js';
import type { SessionType } from '../types.mjs';
import {
  createSession,
  findSession,
  listSessions,
  addCell,
  updateCell,
  findCell,
  sessionToResponse,
  removeCell,
  updateSession
} from '../session.mjs';
import { toValidPackageName } from '../apps/utils.mjs';
import { npmInstall } from '../exec.mjs';
import Path from 'node:path';
import { SRCBOOKS_DIR } from '../constants.mjs';
import type { MCPConfig, MCPFeatureFlags } from './config.mjs';
import { getDefaultMCPConfig, isMCPSubFeatureEnabled, validateMCPConfig } from './config.mjs';
import { MCPMonitor } from './monitoring.mjs';

export interface MCPServerConfig {
  name?: string;
  version?: string;
  transport: 'stdio' | 'http';
  port?: number;
  enableTools?: boolean;
  enableResources?: boolean;
  enablePrompts?: boolean;
}

export class ChassitMCPServer {
  private server: Server;
  private config: MCPConfig;
  private monitor: MCPMonitor;

  constructor(config: Partial<MCPConfig> = {}) {
    this.config = {
      ...getDefaultMCPConfig(),
      ...config
    };

    // Validate configuration
    const validation = validateMCPConfig(this.config);
    if (!validation.valid) {
      throw new Error(`Invalid MCP configuration: ${validation.errors.join(', ')}`);
    }

    // Initialize monitoring
    this.monitor = new MCPMonitor(this.config);

    // Check if MCP is enabled
    if (!this.config.flags.enabled) {
      throw new Error('MCP features are disabled. Set MCP_ENABLED=true to enable.');
    }

    this.server = new Server(
      {
        name: this.config.name!,
        version: this.config.version!,
      },
      {
        capabilities: {
          tools: this.config.flags.tools.enabled ? {} : undefined,
          resources: this.config.flags.resources.enabled ? {} : undefined,
          prompts: this.config.flags.prompts.enabled ? {} : undefined,
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    if (this.config.flags.tools.enabled) {
      this.setupToolHandlers();
    }
    if (this.config.flags.resources.enabled) {
      this.setupResourceHandlers();
    }
    if (this.config.flags.prompts.enabled) {
      this.setupPromptHandlers();
    }
  }

  private setupToolHandlers() {
    // Notebook Management Tools
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: this.getTools(),
      };
    });

    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args = {} } = request.params;

      switch (name) {
        case 'chassit.notebook.create':
          return this.createNotebook(args);
        case 'chassit.notebook.open':
          return this.openNotebook(args);
        case 'chassit.notebook.list':
          return this.listNotebooks();
        case 'chassit.cell.create':
          return this.createCell(args);
        case 'chassit.cell.execute':
          return this.executeCell(args);
        case 'chassit.cell.update':
          return this.updateCellContent(args);
        case 'chassit.cell.delete':
          return this.deleteCell(args);
        case 'chassit.npm.install':
          return this.installPackages(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private setupResourceHandlers() {
    this.server.setRequestHandler('resources/list', async () => {
      return {
        resources: this.getResources(),
      };
    });

    this.server.setRequestHandler('resources/read', async (request) => {
      const { uri } = request.params;
      return this.readResource(uri);
    });
  }

  private setupPromptHandlers() {
    this.server.setRequestHandler('prompts/list', async () => {
      return {
        prompts: this.getPrompts(),
      };
    });

    this.server.setRequestHandler('prompts/get', async (request) => {
      const { name, arguments: args = {} } = request.params;
      return this.getPrompt(name, args);
    });
  }

  private getTools(): Tool[] {
    return [
      {
        name: 'chassit.notebook.create',
        description: 'Create a new TypeScript notebook',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the notebook'
            },
            language: {
              type: 'string',
              enum: ['typescript', 'javascript'],
              description: 'Programming language for the notebook'
            }
          },
          required: ['name']
        }
      },
      {
        name: 'chassit.notebook.open',
        description: 'Open an existing notebook session',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the notebook directory'
            },
            sessionId: {
              type: 'string',
              description: 'Existing session ID to open'
            }
          }
        }
      },
      {
        name: 'chassit.notebook.list',
        description: 'List all available notebook sessions',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'chassit.cell.create',
        description: 'Add a new cell to the notebook',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Session ID of the notebook'
            },
            type: {
              type: 'string',
              enum: ['code', 'markdown'],
              description: 'Type of cell to create'
            },
            content: {
              type: 'string',
              description: 'Content of the cell'
            },
            position: {
              type: 'number',
              description: 'Position to insert the cell (optional)'
            }
          },
          required: ['sessionId', 'type', 'content']
        }
      },
      {
        name: 'chassit.cell.execute',
        description: 'Execute a specific cell or all cells',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Session ID of the notebook'
            },
            cellId: {
              type: 'string',
              description: 'ID of the cell to execute (optional)'
            },
            executeAll: {
              type: 'boolean',
              description: 'Execute all cells if true'
            }
          },
          required: ['sessionId']
        }
      },
      {
        name: 'chassit.cell.update',
        description: 'Update cell content',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Session ID of the notebook'
            },
            cellId: {
              type: 'string',
              description: 'ID of the cell to update'
            },
            content: {
              type: 'string',
              description: 'New content for the cell'
            }
          },
          required: ['sessionId', 'cellId', 'content']
        }
      },
      {
        name: 'chassit.cell.delete',
        description: 'Delete a cell from the notebook',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Session ID of the notebook'
            },
            cellId: {
              type: 'string',
              description: 'ID of the cell to delete'
            }
          },
          required: ['sessionId', 'cellId']
        }
      },
      {
        name: 'chassit.npm.install',
        description: 'Install npm packages in the notebook',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Session ID of the notebook'
            },
            packages: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of package names to install'
            }
          },
          required: ['sessionId', 'packages']
        }
      }
    ];
  }

  private getResources(): Resource[] {
    return [
      {
        uri: 'chassit://notebooks',
        name: 'Available Notebooks',
        description: 'List of all available notebooks and sessions',
        mimeType: 'application/json'
      },
      {
        uri: 'chassit://notebook/{sessionId}',
        name: 'Notebook State',
        description: 'Current state of a notebook session',
        mimeType: 'application/json'
      },
      {
        uri: 'chassit://notebook/{sessionId}/cells',
        name: 'Notebook Cells',
        description: 'All cells in a notebook',
        mimeType: 'application/json'
      }
    ];
  }

  private getPrompts(): Prompt[] {
    return [
      {
        name: 'chassit.prompt.explore',
        description: 'Explore and analyze data',
        arguments: [
          {
            name: 'data_source',
            description: 'URL or file path to data',
            required: true
          },
          {
            name: 'analysis_type',
            description: 'Type of analysis to perform',
            required: true
          }
        ]
      },
      {
        name: 'chassit.prompt.prototype',
        description: 'Create a prototype implementation',
        arguments: [
          {
            name: 'requirements',
            description: 'Feature requirements',
            required: true
          },
          {
            name: 'technology',
            description: 'Technology stack to use',
            required: false
          }
        ]
      }
    ];
  }

  // Tool Implementation Methods
  private async createNotebook(args: any) {
    const { name, language = 'typescript' } = args;

    // Generate a simple session ID from the name
    const sessionId = toValidPackageName(name) + '-' + Date.now();
    const notebookDir = Path.join(SRCBOOKS_DIR, sessionId);

    try {
      const session = await createSession(notebookDir);
      return {
        success: true,
        sessionId: session.id,
        session: sessionToResponse(session)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async openNotebook(args: any) {
    const { path, sessionId } = args;

    try {
      let session: SessionType;

      if (sessionId) {
        session = await findSession(sessionId);
      } else if (path) {
        session = await createSession(path);
      } else {
        throw new Error('Either sessionId or path must be provided');
      }

      return {
        success: true,
        sessionId: session.id,
        session: sessionToResponse(session)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async listNotebooks() {
    try {
      const sessions = await listSessions();
      return {
        success: true,
        sessions: Object.values(sessions).map(sessionToResponse)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async createCell(args: any) {
    const { sessionId, type, content, position } = args;

    try {
      const session = await findSession(sessionId);

      let cell;
      if (type === 'code') {
        cell = {
          id: crypto.randomUUID(),
          type: 'code' as const,
          filename: `cell-${Date.now()}.ts`,
          source: content
        };
      } else if (type === 'markdown') {
        cell = {
          id: crypto.randomUUID(),
          type: 'markdown' as const,
          source: content
        };
      } else {
        throw new Error(`Unsupported cell type: ${type}`);
      }

      const cellPosition = position !== undefined ? position : session.cells.length;
      await addCell(session, cell, cellPosition);

      return {
        success: true,
        cell: cell
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async executeCell(args: any) {
    const { sessionId, cellId, executeAll } = args;

    try {
      const session = await findSession(sessionId);

      if (executeAll) {
        // Execute all code cells in sequence
        const codeCells = session.cells.filter(cell => cell.type === 'code');
        return {
          success: true,
          message: `Would execute ${codeCells.length} code cells`,
          cells: codeCells.map(cell => cell.id)
        };
      } else if (cellId) {
        const cell = findCell(session, cellId);
        if (!cell) {
          throw new Error(`Cell with id ${cellId} not found`);
        }

        if (cell.type !== 'code') {
          throw new Error('Only code cells can be executed');
        }

        return {
          success: true,
          message: `Would execute cell ${cellId}`,
          cell: cell
        };
      } else {
        throw new Error('Either cellId or executeAll must be provided');
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async updateCellContent(args: any) {
    const { sessionId, cellId, content } = args;

    try {
      const session = await findSession(sessionId);
      const cell = findCell(session, cellId);

      if (!cell) {
        throw new Error(`Cell with id ${cellId} not found`);
      }

      const updates = cell.type === 'code' ? { source: content } : { source: content };
      const result = await updateCell(session, cell, updates);

      if (result && !result.success) {
        const errorMessages = result.errors?.map((e: any) => e.message).join(', ') || 'Unknown error';
        throw new Error(errorMessages);
      }

      return {
        success: true,
        cell: result?.cell || cell
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async deleteCell(args: any) {
    const { sessionId, cellId } = args;

    try {
      const session = await findSession(sessionId);
      const cell = findCell(session, cellId);

      if (!cell) {
        throw new Error(`Cell with id ${cellId} not found`);
      }

      const updatedCells = removeCell(session, cellId);
      await updateSession(session, { cells: updatedCells });

      return {
        success: true,
        message: `Cell ${cellId} deleted`,
        remainingCells: updatedCells.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async installPackages(args: any) {
    const { sessionId, packages } = args;

    try {
      const session = await findSession(sessionId);

      return new Promise((resolve) => {
        npmInstall({
          cwd: session.dir,
          packages: packages,
          stdout: (data) => console.log(data),
          stderr: (data) => console.error(data),
          onExit: (exitCode) => {
            if (exitCode === 0) {
              resolve({
                success: true,
                packages: packages,
                message: `Successfully installed ${packages.length} packages`
              });
            } else {
              resolve({
                success: false,
                error: `npm install failed with exit code ${exitCode}`
              });
            }
          }
        });
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Resource Implementation Methods
  private async readResource(uri: string) {
    try {
      if (uri === 'chassit://notebooks') {
        const sessions = await listSessions();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({
                sessions: Object.values(sessions).map(sessionToResponse)
              }, null, 2)
            }
          ]
        };
      }

      if (uri.startsWith('chassit://notebook/')) {
        const parts = uri.split('/');
        const sessionId = parts[2];

        if (!sessionId) {
          throw new Error('Invalid notebook URI: missing session ID');
        }

        if (uri.endsWith('/cells')) {
          const session = await findSession(sessionId);
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  cells: session.cells
                }, null, 2)
              }
            ]
          };
        } else {
          const session = await findSession(sessionId);
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(sessionToResponse(session), null, 2)
              }
            ]
          };
        }
      }

      throw new Error(`Unknown resource URI: ${uri}`);
    } catch (error) {
      throw new Error(`Failed to read resource: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Prompt Implementation Methods
  private async getPrompt(name: string, args: any) {
    switch (name) {
      case 'chassit.prompt.explore':
        return {
          description: 'Explore and analyze data',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Analyze the data from ${args.data_source} using ${args.analysis_type} analysis. Create a notebook that loads the data, performs the analysis, and visualizes the results.`
              }
            }
          ]
        };

      case 'chassit.prompt.prototype':
        return {
          description: 'Create a prototype implementation',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Create a prototype implementation for: ${args.requirements}${args.technology ? ` using ${args.technology}` : ''}. Build this as a step-by-step notebook with clear explanations and working code.`
              }
            }
          ]
        };

      default:
        throw new Error(`Unknown prompt: ${name}`);
    }
  }

  async start() {
    // For now, only support stdio transport until we understand the HTTP server setup better
    if (this.config.transport !== 'stdio') {
      throw new Error('Only stdio transport is currently supported for MCP server');
    }

    const transport = new StdioServerTransport();

    console.log(`Starting Chassit MCP Server with ${this.config.transport} transport...`);
    await this.server.connect(transport);
    console.log('Chassit MCP Server started successfully');
  }

  async stop() {
    await this.server.close();
    console.log('Chassit MCP Server stopped');
  }
}