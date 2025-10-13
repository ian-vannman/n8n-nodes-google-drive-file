# n8n-nodes-google-drive-file-text

This is an n8n community node that allows you to fetch Google Drive file metadata and content in your n8n workflows. Get complete metadata or export document content as strings (Docs → Markdown, Sheets → CSV, Slides → Plain Text).

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation) · [Operations](#operations) · [Credentials](#credentials) · [Usage](#usage) · [License](#license)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### Community Nodes (Recommended)

1. Go to **Settings > Community Nodes** in n8n
2. Select **Install a community node**
3. Enter `n8n-nodes-google-drive-file-text`
4. Click **Install**

### Manual Installation

```bash
npm install n8n-nodes-google-drive-file-text
```

## Operations

### Google Drive Metadata

This node supports two operations:

1. **Get Metadata**: Retrieve complete metadata for a Google Drive file
2. **Get Content**: Fetch the file content as a string in the appropriate format:
   - Google Docs → Markdown format
   - Google Sheets → CSV format
   - Google Slides → Plain text format

Both operations accept file input as either:
- File URL (e.g., `https://drive.google.com/file/d/FILE_ID/view`)
- File ID (e.g., `1a2b3c4d5e6f7g8h9i0j`)

## Credentials

This node uses the built-in **Google Drive OAuth2 API** credentials in n8n. You'll need to:

1. Set up Google Drive OAuth2 credentials in n8n
2. Configure the OAuth2 application in Google Cloud Console
3. Enable the Google Drive API
4. Set the appropriate scopes (read-only metadata access)

## Compatibility

- Tested with n8n version 1.0.0+
- Requires Node.js 18+

## Usage

1. Add the "Google Drive Metadata" node to your workflow
2. Connect your Google Drive OAuth2 API credentials
3. Select the operation:
   - **Get Metadata**: Returns complete file metadata
   - **Get Content**: Returns the file content as a string
4. Choose input type:
   - **File URL**: Paste the full Google Drive file URL
   - **File ID**: Enter just the file ID
5. Execute the node

## Output

### Get Metadata Operation

Returns all available metadata fields including:

- Basic info: name, mimeType, size, createdTime, modifiedTime
- Owner and sharing information
- File capabilities and permissions
- Extended properties
- Export links for different formats
- And all other available fields from the Google Drive API

### Get Content Operation

Returns a JSON object with:

- `fileId`: The Google Drive file ID
- `fileName`: The name of the file
- `mimeType`: The Google file type
- `exportFormat`: The format used for export (text/markdown, text/csv, or text/plain)
- `content`: The file content as a string

**Supported file types:**
- Google Docs (exported as Markdown, with fallback to Plain Text)
- Google Sheets (exported as CSV)
- Google Slides (exported as Plain Text)

Note: The node will attempt to use the preferred export format and fall back to alternative formats if the preferred one is not available.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Google Drive API documentation](https://developers.google.com/drive/api/v3/reference/files)
- [GitHub Repository](https://github.com/ian-vannman/n8n-nodes-google-drive-file-text)
- [Report Issues](https://github.com/ian-vannman/n8n-nodes-google-drive-file-text/issues)

## Version History

See [CHANGELOG](https://github.com/ian-vannman/n8n-nodes-google-drive-file-text/releases) for version history.

## License

[MIT](LICENSE.md)
