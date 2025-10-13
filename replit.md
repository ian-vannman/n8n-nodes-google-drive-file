# Google Drive File n8n Node

## Overview

This is a community node package for n8n workflow automation platform that enables users to fetch both metadata and content from Google Drive files. The node accepts either a Google Drive file URL or file ID as input and can return either complete file metadata or the actual document content as strings. For content fetching, it exports Google Docs as Markdown, Sheets as CSV, and Slides as Plain Text. Built as an extension to n8n's ecosystem, it leverages the Google Drive API v3 through OAuth2 authentication to provide read-only access.

**Package Name**: `n8n-nodes-google-drive-file-text`  
**Repository**: https://github.com/ian-vannman/n8n-nodes-google-drive-file-text  
**Author**: Ian Vannman  
**Email**: ian@vannman.com  
**Version**: 1.0.4

## Recent Changes

### Version 1.0.4 (October 2025)
- **New content fetching operation**: Added "Get Content" operation to fetch document content as strings
  - Google Docs → Markdown (with fallback to plain text)
  - Google Sheets → CSV
  - Google Slides → Plain text
- **Smart export format selection**: Implements fallback logic to try multiple export formats (text/markdown → text/x-markdown → text/plain for Docs)
- **Enhanced error handling**: Provides clear error messages for unsupported file types and missing export links
- **Dual operation support**: Node now supports both "Get Metadata" and "Get Content" operations

### Version 1.0.3 (October 2025)
- **Fixed URL parsing for all Google Workspace document types**: Rewrote URL parser using proper URL API and path segment logic instead of brittle regex patterns
- **Comprehensive URL support**: Now handles Google Docs, Sheets, Slides, Forms URLs with all variations:
  - Domain-scoped URLs: `/a/example.com/document/d/ID`
  - User-scoped URLs: `/u/0/file/d/ID`
  - Forms with /d/e/ pattern: `/forms/d/e/ID`
  - Any combination of path segments
- **More robust parsing**: Uses URL API with segment inspection, properly validates Google domains (docs.google.com, drive.google.com)

### Version 1.0.2 (October 2025)
- **Critical crash fix**: Removed googleapis library that was causing n8n instance crashes due to dependency conflicts
- **Switched to n8n's built-in authentication**: Now uses n8n's built-in `googleDriveOAuth2Api` instead of custom credentials
- **Zero runtime dependencies**: Uses n8n's `requestOAuth2` helper for API calls, eliminating all external runtime dependencies
- **Fixed package structure**: Main entry now points directly to compiled node file

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Project Structure
The project follows n8n's community node package conventions with TypeScript-based development:
- **Source Code**: Located in `nodes/GoogleDriveFileText/` directory containing TypeScript implementation
- **Build Output**: Compiled JavaScript outputs to `dist/nodes/GoogleDriveFileText/` directory
- **Entry Point**: `package.json` main field points directly to `dist/nodes/GoogleDriveFileText/GoogleDriveFileText.node.js`
- **Assets**: Node icon (SVG) is copied from source to dist during build

### Node Architecture
**n8n Community Node Pattern**: The implementation extends n8n's `INodeType` interface to integrate seamlessly with the n8n workflow system. The node is registered in `package.json` under the `n8n` field, specifying both the node implementation and credential configuration.

**Rationale**: This architecture allows the node to be discovered and loaded by n8n's plugin system automatically when installed as an npm package.

**Dual Operation Design**: The node supports two complementary operations:
1. **Get Metadata**: Fetches complete file metadata from Google Drive API
2. **Get Content**: Exports and retrieves document content as strings

**Content Export Strategy**: 
- Uses Google Drive's `exportLinks` from metadata response to determine available formats
- Implements fallback logic for format selection (e.g., Docs: text/markdown → text/x-markdown → text/plain)
- Returns content as strings, not binary data, for easy workflow integration
- Supports Google Docs (Markdown), Sheets (CSV), and Slides (Plain Text)

**Rationale**: The dual operation design maintains simplicity while expanding functionality. Both operations share the same file ID extraction logic, and the content operation leverages metadata retrieval internally.

### Authentication Architecture
**Built-in n8n Credentials**: Uses n8n's built-in `googleDriveOAuth2Api` credential type directly (no custom credentials).

**Rationale**: Leveraging n8n's existing OAuth2 infrastructure eliminates dependency conflicts, ensures version compatibility, and provides a consistent authentication experience across all Google services in n8n.

**API Access Pattern**: Uses n8n's `this.helpers.requestOAuth2.call()` helper method for all API requests.

**Pros**:
- No external dependencies - prevents crashes and conflicts
- Automatic OAuth2 token management handled by n8n
- Consistent with other n8n Google nodes
- No custom credential maintenance required

**Read-Only Scope**: Configured with `drive.metadata.readonly` scope (principle of least privilege)

### Data Processing
**File ID Extraction**: The node implements robust URL parsing using the URL API and path segment logic, supporting all Google Workspace document URL formats:
- **Google Docs, Sheets, Slides, Forms**: `/document/d/ID`, `/spreadsheets/d/ID`, `/presentation/d/ID`, `/forms/d/ID`, `/forms/d/e/ID`
- **Domain-scoped URLs**: `/a/example.com/document/d/ID`
- **User-scoped URLs**: `/u/0/file/d/ID`
- **Folder URLs**: `/drive/folders/ID` or `/drive/u/0/folders/ID`
- **Query parameter URLs**: `?id=ID`
- **Direct file IDs**: Just the ID string

**Implementation Approach**: 
1. Uses URL API to parse and validate Google domains (docs.google.com, drive.google.com)
2. Splits pathname into segments
3. Finds `/d/` or `/d/e/` pattern in path
4. Extracts the file ID that follows

**Rationale**: Path segment logic is more maintainable and robust than complex regex patterns. Handles all current and future URL variations without brittle pattern matching.

**API Communication**: Uses n8n's `requestOAuth2` helper for direct REST API calls to Google Drive API v3.

**Alternatives Considered**: googleapis npm package

**Why requestOAuth2 was chosen**:
- Zero external dependencies - prevents crashes
- Lightweight - no large dependency tree
- Direct control over API requests
- Perfect integration with n8n's OAuth2 system

**Cons of googleapis library** (why it was removed):
- Caused n8n instance crashes due to dependency conflicts
- Large dependency size with nested packages
- Unnecessary abstraction for simple metadata fetch

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

### Runtime Dependencies
**None** - The package has zero runtime dependencies to prevent conflicts and crashes in n8n instances.

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