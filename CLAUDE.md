# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Srcbook is a TypeScript-centric app development platform with two main products:
- An AI app builder (can be hosted online at srcbook.com)
- A TypeScript notebook system

This is a monorepo using pnpm workspaces and Turbo for build orchestration.

## Common Development Commands

### Development
```bash
# Start both API and web servers in development mode
pnpm dev

# Run development for specific package
pnpm dev --filter @srcbook/api
pnpm dev --filter @srcbook/web
```

### Building
```bash
# Build all packages
pnpm build

# Build specific package
pnpm build --filter @srcbook/api
```

### Testing
```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm test --filter @srcbook/api
```

### Linting & Type Checking
```bash
# Run linting across all packages
pnpm lint

# Check types across all packages
pnpm check-types

# Format code
pnpm format
```

### Database Operations
```bash
# Generate database migrations (after modifying packages/api/db/schema.mts)
pnpm generate --name <migration_name>

# Apply migrations
pnpm migrate
```

### Release Process
```bash
# Create a changeset for your changes
pnpm changeset

# Version packages (CI only)
pnpm ci:version

# Publish packages (CI only)
pnpm ci:publish
```

## Architecture

### Package Structure
- **packages/api** - Express server with WebSocket support, SQLite database via Drizzle ORM
- **packages/web** - React frontend with Vite, CodeMirror integration
- **packages/shared** - Shared types and utilities
- **packages/components** - Shared React components
- **packages/configs** - Shared ESLint and TypeScript configurations
- **srcbook** - CLI application that bundles API and serves the web app

### Key Technologies
- **Frontend**: React, Vite, CodeMirror, TailwindCSS, React Router
- **Backend**: Express, WebSocket (ws), SQLite with Drizzle ORM
- **AI Integration**: Supports Anthropic, OpenAI, and Google AI SDKs
- **Build**: Turbo, TypeScript, pnpm workspaces

### Database
- SQLite database located at `~/.srcbook/srcbook.db`
- Schema defined in `packages/api/db/schema.mts`
- Migrations in `packages/api/drizzle/`

### App Templates
App templates are stored in `packages/api/apps/templates/` and used for creating new apps.

### Srcbook Examples
Example notebooks are stored in `packages/api/srcbook/examples/` and can be imported by users.

## Development Notes

### Node Version
Requires Node 18+ (use nvm if managing multiple versions). If switching Node versions, run `pnpm rebuild -r` due to better-sqlite3 native bindings.

### Package Management
Uses pnpm 9.5+ with workspaces. The packageManager field in package.json enforces the correct version.

### Adding Dependencies
```bash
# Add to specific package
pnpm add <dep> --filter api

# Add dev dependency
pnpm add -D <dep> --filter api

# Add workspace dependency
pnpm add @srcbook/shared --workspace --filter api
```

### Environment Variables
- `SRCBOOK_DISABLE_ANALYTICS` - Disable telemetry
- `NODE_ENV` - Development/production mode
- `PORT` - Server port
- Various `VITE_SRCBOOK_*` variables for frontend configuration

### AI Prompts
AI prompts for app generation and modification are stored in `packages/api/prompts/`.

### TypeScript Configuration
Each package has its own tsconfig.json extending from shared configs in packages/configs/ts/.