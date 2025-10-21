# n8n-nodes-google-drive-file

This is an n8n community node that allows you to fetch Google Drive file metadata and content in your n8n workflows. Get complete metadata or export document content as strings (Docs → Markdown, Sheets → CSV, Slides → Plain Text).

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation) · [Operations](#operations) · [Credentials](#credentials) · [Usage](#usage) · [License](#license)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### Community Nodes (Recommended)

1. Go to **Settings > Community Nodes** in n8n
2. Select **Install a community node**
3. Enter `n8n-nodes-google-drive-file`
4. Click **Install**

### Manual Installation

```bash
npm install n8n-nodes-google-drive-file
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

1. Add the "Google Drive File" node to your workflow
2. Connect your Google Drive OAuth2 API credentials
3. Select the operation:
   - **Get Metadata**: Returns complete file metadata
   - **Get Content**: Returns the file content as a string
4. Choose input type:
   - **File URL**: Paste the full Google Drive file URL
   - **File ID**: Enter just the file ID
5. For Get Content operation, optionally enable **Include Images** to extract images separately (see warning below)
6. Execute the node

### Image Extraction (Get Content only)

When fetching content from Google Docs, you can choose whether to include images:

- **Include Images = false** (default): Images are removed from the markdown, and inline base64 data is replaced with simple references like `![alt](image-0)`. No image data is returned. This keeps output size small.
- **Include Images = true**: Images are extracted and returned in a separate `images` array with base64 data. The markdown content still uses simple references.

⚠️ **Warning**: Images can make the output significantly larger, which may impact n8n performance. Only enable this option if you need the image data.

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
- `modifiedTime`: When the file was last modified (ISO 8601 format)
- `content`: The file content as a string (with inline base64 images replaced by references like `image-0`)
- `images`: Array of extracted images (only present when "Include Images" is enabled and images exist)
  - `id`: Reference ID used in the markdown (e.g., "image-0")
  - `format`: Image format (e.g., "png", "jpeg", "gif")
  - `data`: Base64-encoded image data

**Supported file types:**
- Google Docs (exported as Markdown, with fallback to Plain Text)
- Google Sheets (exported as CSV)
- Google Slides (exported as Plain Text)

**Image handling for Google Docs:**
- By default, inline base64 images are replaced with simple references to keep output size small
- Enable "Include Images" to extract and return the actual image data separately
- Images are always removed from inline markdown to improve readability

Note: The node will attempt to use the preferred export format and fall back to alternative formats if the preferred one is not available.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Google Drive API documentation](https://developers.google.com/drive/api/v3/reference/files)
- [GitHub Repository](https://github.com/ian-vannman/n8n-nodes-google-drive-file)
- [Report Issues](https://github.com/ian-vannman/n8n-nodes-google-drive-file/issues)

## Version History

See [CHANGELOG](https://github.com/ian-vannman/n8n-nodes-google-drive-file/releases) for version history.

## License

[MIT](LICENSE.md)
