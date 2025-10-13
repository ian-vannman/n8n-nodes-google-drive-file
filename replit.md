# Google Drive File Metadata n8n Node

## Overview

This is a community node package for n8n workflow automation platform that enables users to fetch complete metadata from Google Drive files. The node accepts either a Google Drive file URL or file ID as input and returns comprehensive metadata including file properties, ownership information, sharing settings, and capabilities. Built as an extension to n8n's ecosystem, it leverages the Google Drive API v3 through OAuth2 authentication to provide read-only access to file metadata.

**Package Name**: `n8n-nodes-google-drive-file-metadata`  
**Repository**: https://github.com/ian-vannman/n8n-nodes-google-drive-file-metadata  
**Author**: Ian Vannman  
**Version**: 1.0.0

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Project Structure
The project follows n8n's community node package conventions with TypeScript-based development:
- **Source Code**: Located in `nodes/` and `credentials/` directories containing TypeScript implementations
- **Build Output**: Compiled JavaScript outputs to `dist/` directory
- **Entry Point**: `index.js` serves as the main module entry, pointing to the compiled node implementation
- **Assets**: Node icons (SVG/PNG) are copied from source to dist during build

### Node Architecture
**n8n Community Node Pattern**: The implementation extends n8n's `INodeType` interface to integrate seamlessly with the n8n workflow system. The node is registered in `package.json` under the `n8n` field, specifying both the node implementation and credential configuration.

**Rationale**: This architecture allows the node to be discovered and loaded by n8n's plugin system automatically when installed as an npm package.

**Single Operation Design**: The node implements a focused operation - fetching file metadata. This simplicity reduces complexity and makes the node easier to maintain and test.

### Authentication Architecture
**OAuth2 Credential Inheritance**: The custom `GoogleDriveOAuth2Api` credential extends n8n's built-in `googleOAuth2Api` credential type rather than implementing OAuth2 from scratch.

**Rationale**: This leverages n8n's existing OAuth2 infrastructure, reducing code duplication and ensuring consistent authentication behavior across Google services.

**Read-Only Scope**: The credential is configured with the `drive.metadata.readonly` scope, implementing the principle of least privilege.

**Pros**: 
- Secure by default - cannot modify files
- Reduces risk of accidental data modification
- Simpler permission model for users

**Cons**: 
- Cannot be used for write operations
- Requires separate credentials if write access is needed later

### Data Processing
**File ID Extraction**: The node implements flexible input handling through pattern matching, supporting multiple Google Drive URL formats (file URLs, folder URLs, direct IDs).

**Rationale**: Users often copy URLs from their browser, so supporting multiple formats improves user experience and reduces configuration errors.

**Google APIs Client Library**: Uses the official `googleapis` npm package to interact with Google Drive API v3.

**Alternatives Considered**: Direct REST API calls via HTTP requests

**Chosen Approach Pros**:
- Type safety through TypeScript definitions
- Automatic handling of authentication token refresh
- Built-in error handling and retry logic
- Simpler API surface

**Cons**:
- Larger dependency size
- Additional abstraction layer

### Build System
**TypeScript Compilation**: Source code is written in TypeScript and compiled to JavaScript for distribution.

**Rationale**: TypeScript provides type safety and better IDE support during development while maintaining JavaScript compatibility for n8n runtime.

**Gulp for Asset Management**: Uses Gulp to copy icon assets from source to distribution directory.

**Rationale**: Simple, focused build task that separates asset copying from TypeScript compilation. The build process is intentionally minimal - TypeScript handles code compilation, Gulp handles static assets.

**Alternative**: Could use npm scripts with shell commands, but Gulp provides better cross-platform compatibility.

### Code Quality
**Linting**: Uses TSLint for code quality enforcement (note: TSLint is deprecated but still functional).

**Formatting**: Prettier for consistent code formatting across the codebase.

**Rationale**: Automated formatting and linting reduce code review friction and maintain consistency.

## External Dependencies

### Core Runtime Dependencies
- **googleapis** (v128.0.0+): Official Google APIs client library for Node.js
  - Purpose: Provides typed interfaces to Google Drive API v3
  - Used for: File metadata retrieval, OAuth2 token management
  
- **n8n-core** (v1.0.0+): n8n core functionality library
  - Purpose: Core utilities and helpers for n8n node development

### Development Dependencies
- **n8n-workflow** (v1.0.0+): n8n workflow type definitions and interfaces
  - Purpose: Provides TypeScript types for implementing n8n nodes
  - Note: Also specified as a peer dependency to ensure version compatibility

- **TypeScript** (v5.3.0+): TypeScript compiler
  - Purpose: Compiles TypeScript source to JavaScript

- **Gulp** (v4.0.2+): Build automation toolkit
  - Purpose: Copies icon assets during build process

- **Prettier** (v3.0.0+) & **TSLint** (v6.1.3): Code formatting and linting
  - Purpose: Maintains code quality and consistency

### External APIs
- **Google Drive API v3**: REST API for accessing Google Drive
  - Authentication: OAuth2 with `drive.metadata.readonly` scope
  - Endpoint Usage: File metadata retrieval (files.get method with all fields)
  - Rate Limits: Subject to Google API quotas (handled by googleapis library)

### Platform Requirements
- **Node.js**: Version 18+ required
- **n8n**: Version 1.0.0+ required
- **Runtime Environment**: Designed to run within n8n's Node.js execution context