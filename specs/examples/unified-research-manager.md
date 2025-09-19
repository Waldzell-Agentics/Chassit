# Unified Research Manager Tool Specification

## Overview

This specification describes a simplified approach to consolidating 12 individual MCP search/retrieval tools into a single unified tool, without requiring any modifications to existing tool implementations.

## Motivation

The current system has 12 separate MCP tools for different search operations:
- `web_search_exa`
- `company_research_exa`
- `research_paper_search_exa`
- `crawling_exa`
- `competitor_finder_exa`
- `linkedin_search_exa`
- `wikipedia_search_exa`
- `github_search_exa`
- `scrape_reddit_exa` (reddit search)
- `youtube_search_exa`
- `tiktok_search_exa`
- `youtube_video_details_exa`

This creates cognitive overhead for users who need to remember 12 different tool names and their parameter structures. A unified tool reduces this to a single interface with operation selection.

## Design Principles

1. **Zero Refactoring**: No changes to existing tool files
2. **Pure Composition**: Import and wrap existing functionality
3. **Maintain Validation**: Preserve parameter validation from original tools
4. **Backward Compatible**: All original tools remain available
5. **Simple Implementation**: Minimal code, maximum clarity

## Technical Approach

### Core Concept

Create a "proxy" MCP server that intercepts tool registrations from existing tools, captures their schemas and handlers, and re-exposes them through a unified interface.

### Implementation Strategy

```typescript
// Pseudo-code showing the approach
const fakeServer = {
  tool: (name, description, schema, handler) => {
    // Capture tool definition instead of registering
    toolMap.set(operationName, { schema, handler });
  }
};

// Pass fake server to existing registration functions
registerWebSearchTool(fakeServer, config);
// ... register all tools

// Register unified tool with real server
server.tool('research_manager', ..., async ({ operation, params }) => {
  const tool = toolMap.get(operation);
  // Validate params with captured schema
  // Call captured handler
});
```

## Detailed Implementation

### File: `src/tools/researchManager.ts`

```typescript
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createRequestLogger } from '../utils/logger.js';

// Import all tool registration functions
import { registerWebSearchTool } from './webSearch.js';
import { registerCompanyResearchTool } from './companyResearch.js';
import { registerResearchPaperSearchTool } from './researchPaperSearch.js';
import { registerCrawlingTool } from './crawling.js';
import { registerCompetitorFinderTool } from './competitorFinder.js';
import { registerLinkedInSearchTool } from './linkedInSearch.js';
import { registerWikipediaSearchTool } from './wikipediaSearch.js';
import { registerGithubSearchTool } from './githubSearch.js';
import { registerRedditSearchTool } from './redditSearch.js';
import { registerYoutubeSearchTool } from './youtubeSearch.js';
import { registerTiktokSearchTool } from './tiktokSearch.js';
import { registerYoutubeVideoDetailsTool } from './youtubeVideoDetails.js';

export function registerResearchManagerTool(
  server: McpServer, 
  config?: { exaApiKey?: string; youtubeApiKey?: string }
): void {
  // Storage for captured tools
  const toolMap = new Map<string, { schema: any, handler: any }>();
  
  // Mapping of actual tool names to operation names
  const toolNameToOperation: Record<string, string> = {
    'web_search_exa': 'web_search',
    'company_research_exa': 'company_research',
    'research_paper_search_exa': 'research_paper_search',
    'crawling_exa': 'crawl_url',
    'competitor_finder_exa': 'find_competitors',
    'linkedin_search_exa': 'linkedin_search',
    'wikipedia_search_exa': 'wikipedia_search',
    'github_search_exa': 'github_search',
    'scrape_reddit_exa': 'reddit_search', // Note: different from key in availableTools
    'youtube_search_exa': 'youtube_search',
    'tiktok_search_exa': 'tiktok_search',
    'youtube_video_details_exa': 'youtube_video_details'
  };
  
  // Create fake server to capture tool registrations
  const fakeServer = {
    tool: (name: string, description: string, schema: any, handler: any) => {
      const operation = toolNameToOperation[name];
      if (operation) {
        toolMap.set(operation, { schema, handler });
      }
    }
  };
  
  // Register all tools to our fake server to capture them
  registerWebSearchTool(fakeServer as any, config);
  registerCompanyResearchTool(fakeServer as any, config);
  registerResearchPaperSearchTool(fakeServer as any, config);
  registerCrawlingTool(fakeServer as any, config);
  registerCompetitorFinderTool(fakeServer as any, config);
  registerLinkedInSearchTool(fakeServer as any, config);
  registerWikipediaSearchTool(fakeServer as any, config);
  registerGithubSearchTool(fakeServer as any, config);
  registerRedditSearchTool(fakeServer as any, config);
  registerYoutubeSearchTool(fakeServer as any, config);
  registerTiktokSearchTool(fakeServer as any, config);
  registerYoutubeVideoDetailsTool(fakeServer as any, config);
  
  // Register the unified tool
  server.tool(
    'research_manager',
    'Unified research tool for all search and retrieval operations. Select an operation and provide the required parameters for that operation.',
    {
      operation: z.enum([
        'web_search',
        'company_research',
        'research_paper_search',
        'crawl_url',
        'find_competitors',
        'linkedin_search',
        'wikipedia_search',
        'github_search',
        'reddit_search',
        'youtube_search',
        'tiktok_search',
        'youtube_video_details'
      ]).describe('Type of research operation to perform'),
      params: z.record(z.any()).describe('Parameters specific to the selected operation. Each operation has different required parameters.')
    },
    async ({ operation, params }) => {
      const logger = createRequestLogger(
        `research_manager-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        'research_manager'
      );
      
      logger.start(`${operation}: ${JSON.stringify(params).substring(0, 100)}...`);
      
      try {
        // Get the tool configuration
        const tool = toolMap.get(operation);
        if (!tool) {
          throw new Error(`Unknown operation: ${operation}. Valid operations are: ${Array.from(toolMap.keys()).join(', ')}`);
        }
        
        // Validate parameters using the tool's original schema
        const validationResult = tool.schema.safeParse(params);
        if (!validationResult.success) {
          const errors = validationResult.error.errors.map(e => 
            `${e.path.join('.')}: ${e.message}`
          ).join('; ');
          throw new Error(`Invalid parameters for ${operation}: ${errors}`);
        }
        
        // Call the original handler with validated params
        const result = await tool.handler(validationResult.data);
        
        logger.complete();
        return result;
        
      } catch (error) {
        logger.error(error);
        
        // Enhanced error messages
        if (error instanceof Error && error.message.includes('Invalid parameters')) {
          // Get the schema for this operation to provide helpful hints
          const tool = toolMap.get(operation);
          if (tool && tool.schema._def && tool.schema._def.shape) {
            const params = Object.keys(tool.schema._def.shape());
            return {
              content: [{
                type: "text" as const,
                text: JSON.stringify({
                  error: error.message,
                  hint: `Required parameters for '${operation}': ${params.join(', ')}`,
                  example: getExampleForOperation(operation)
                }, null, 2)
              }],
              isError: true
            };
          }
        }
        
        return {
          content: [{
            type: "text" as const,
            text: `Research manager error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  );
}

// Helper function to provide examples
function getExampleForOperation(operation: string): any {
  const examples: Record<string, any> = {
    'web_search': { query: 'AI developments 2024', numResults: 5 },
    'company_research': { companyName: 'Tesla', numResults: 5 },
    'research_paper_search': { query: 'machine learning healthcare', numResults: 5 },
    'crawl_url': { url: 'https://example.com/article', maxCharacters: 3000 },
    'find_competitors': { companyName: 'Stripe', numResults: 5 },
    'linkedin_search': { query: 'software engineer San Francisco', searchType: 'profiles' },
    'wikipedia_search': { query: 'artificial intelligence', numResults: 5 },
    'github_search': { query: 'react typescript', searchType: 'repositories' },
    'reddit_search': { query: 'best programming practices', subreddit: 'programming' },
    'youtube_search': { query: 'typescript tutorial', searchType: 'videos' },
    'tiktok_search': { query: 'coding tips', numResults: 5 },
    'youtube_video_details': { videoIds: 'dQw4w9WgXcQ,jNQXAC9IVRw' }
  };
  
  return examples[operation] || {};
}
```

## Integration with index.ts

Add to `src/index.ts`:

```typescript
import { registerResearchManagerTool } from "./tools/researchManager.js";

// In availableTools:
const availableTools = {
  // ... existing tools ...
  'research_manager': { 
    name: 'Unified Research Manager', 
    description: 'All research operations in one tool', 
    enabled: true 
  }
};

// In tool registration section:
if (shouldRegisterTool('research_manager')) {
  registerResearchManagerTool(server, config);
  registeredTools.push('research_manager');
}
```

## Usage Examples

### Before (Individual Tools)
```json
// Tool: web_search_exa
{
  "query": "AI developments 2024",
  "numResults": 10
}

// Tool: company_research_exa
{
  "companyName": "OpenAI",
  "numResults": 5
}
```

### After (Unified Tool)
```json
// Tool: research_manager
{
  "operation": "web_search",
  "params": {
    "query": "AI developments 2024",
    "numResults": 10
  }
}

// Tool: research_manager
{
  "operation": "company_research",
  "params": {
    "companyName": "OpenAI",
    "numResults": 5
  }
}
```

## Benefits

1. **Single Tool Interface**: Users only need to remember one tool name
2. **Consistent Structure**: All operations follow the same pattern
3. **Better Discoverability**: Operation enum provides autocomplete
4. **Preserved Validation**: Original parameter validation is maintained
5. **No Breaking Changes**: All original tools continue to work
6. **Minimal Code**: ~150 lines of code for entire implementation

## Known Issues to Fix

1. **Reddit Tool Naming**: The reddit tool registers as `scrape_reddit_exa` but is listed as `reddit_search_exa` in availableTools. This should be made consistent.

## Migration Path

1. Users can continue using individual tools
2. New users can start with the unified tool
3. Gradual migration as users prefer
4. No code changes required in existing workflows

## Future Enhancements

1. **Dynamic Schema Generation**: Could potentially generate a proper discriminated union schema dynamically
2. **Operation Aliases**: Support multiple names for operations (e.g., 'web' for 'web_search')
3. **Batch Operations**: Support multiple operations in a single call
4. **Operation Discovery**: Add an operation to list all available operations with their parameters

## Conclusion

This approach provides maximum value with minimal complexity. By leveraging JavaScript's dynamic nature and the MCP server's tool registration pattern, we can create a unified interface without touching any existing code. The implementation is straightforward, maintainable, and provides a better developer experience while maintaining full backward compatibility.