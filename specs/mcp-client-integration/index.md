# MCP Client Integration Specifications

## Overview
This batch contains specifications for integrating MCP (Model Context Protocol) client capabilities into the Chassit project, generated from the integration report and updated based on official specification research.

**Generated**: 2025-09-13
**Source**: `reports/mcp-client-integration.md`
**Protocol**: idea-to-specs
**Last Updated**: 2025-09-13

## Specifications

| ID | Title | Summary | Status |
|----|-------|---------|--------|
| 01 | [MCP Client Integration](./01-mcp-client-integration.md) | Initial integration design with mixed transport approaches including WebSocket | Superseded |
| 02 | [MCP Streamable HTTP Implementation](./02-mcp-streamable-http-implementation.md) | Corrected implementation using official Streamable HTTP transport per MCP 2025-06-18 spec | Current |

## Important Update (2025-09-13)

Research revealed that WebSockets are **not** part of the official MCP specification. The current spec (2025-06-18) defines only:
- **stdio** transport for local servers
- **Streamable HTTP** transport for remote servers (replaced SSE in March 2025)

WebSocket support (SEP-1288) is only a proposal under review. Specification 02 provides the corrected implementation strategy.

## Metadata

- **Ideas Extracted**: 1 (initial)
- **Specifications Created**: 2 (initial + corrected)
- **Template Used**: Built-in spec template
- **Research Conducted**: MCP specification verification via Exa and Firecrawl

## Context
This specification was generated from a comprehensive integration report that analyzed the Chassit project architecture and proposed a modular approach to adding MCP client capabilities. After parallel implementation testing revealed WebSocket assumptions, additional research was conducted to align with the official MCP specification, resulting in the corrected Streamable HTTP implementation strategy.

## Next Steps
1. Review specification with development team
2. Validate technical approach against current codebase
3. Create implementation tickets from spec phases
4. Begin Phase 1 foundation work

## References
- [Original Report](../../reports/mcp-client-integration.md)
- [Chassit Project README](../../README.md)
- [MCP Protocol Documentation](https://mcp.io/docs)