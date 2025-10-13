# n8n-nodes-google-drive-metadata

This is an n8n community node that allows you to fetch complete Google Drive file metadata in your n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

### Google Drive Metadata

- **Fetch File Metadata**: Retrieve complete metadata for a Google Drive file using either:
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
3. Choose input type:
   - **File URL**: Paste the full Google Drive file URL
   - **File ID**: Enter just the file ID
4. Execute the node to retrieve complete file metadata

## Metadata Returned

The node returns all available metadata fields including:

- Basic info: name, mimeType, size, createdTime, modifiedTime
- Owner and sharing information
- File capabilities and permissions
- Extended properties
- And all other available fields from the Google Drive API

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Google Drive API documentation](https://developers.google.com/drive/api/v3/reference/files)

## License

[MIT](LICENSE.md)
