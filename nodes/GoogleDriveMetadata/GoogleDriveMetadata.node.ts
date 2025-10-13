import {
        IExecuteFunctions,
        INodeExecutionData,
        INodeType,
        INodeTypeDescription,
        NodeOperationError,
} from 'n8n-workflow';

function extractFileIdFromUrl(input: string): string | null {
        const idPattern = /^[a-zA-Z0-9_-]+$/;
        if (idPattern.test(input)) {
                return input;
        }

        const idParamMatch = input.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (idParamMatch) {
                return idParamMatch[1];
        }

        const foldersMatch = input.match(/\/folders\/([a-zA-Z0-9_-]+)/);
        if (foldersMatch) {
                return foldersMatch[1];
        }

        try {
                const urlObj = new URL(input);

                if (!['docs.google.com', 'drive.google.com'].includes(urlObj.hostname)) {
                        return null;
                }

                const pathSegments = urlObj.pathname.split('/').filter(s => s.length > 0);

                const dIndex = pathSegments.indexOf('d');
                if (dIndex !== -1 && dIndex < pathSegments.length - 1) {
                        const nextSegment = pathSegments[dIndex + 1];

                        if (nextSegment === 'e' && dIndex < pathSegments.length - 2) {
                                return pathSegments[dIndex + 2];
                        }

                        return nextSegment;
                }
        } catch (e) {
                return null;
        }

        return null;
}

function getExportMimeTypes(googleMimeType: string): string[] | null {
        const mimeTypeMap: { [key: string]: string[] } = {
                'application/vnd.google-apps.document': ['text/markdown', 'text/x-markdown', 'text/plain'],
                'application/vnd.google-apps.spreadsheet': ['text/csv'],
                'application/vnd.google-apps.presentation': ['text/plain'],
        };
        
        return mimeTypeMap[googleMimeType] || null;
}

function findAvailableExportLink(exportLinks: any, preferredMimeTypes: string[]): { url: string; mimeType: string } | null {
        for (const mimeType of preferredMimeTypes) {
                if (exportLinks[mimeType]) {
                        return { url: exportLinks[mimeType], mimeType };
                }
        }
        return null;
}

export class GoogleDriveMetadata implements INodeType {
        description: INodeTypeDescription = {
                displayName: 'Google Drive Metadata',
                name: 'googleDriveMetadata',
                icon: 'file:googledrive.svg',
                group: ['transform'],
                version: 1,
                subtitle: '={{$parameter["operation"]}}',
                description: 'Fetch complete Google Drive file metadata',
                defaults: {
                        name: 'Google Drive Metadata',
                },
                inputs: ['main'],
                outputs: ['main'],
                credentials: [
                        {
                                name: 'googleDriveOAuth2Api',
                                required: true,
                        },
                ],
                properties: [
                        {
                                displayName: 'Operation',
                                name: 'operation',
                                type: 'options',
                                options: [
                                        {
                                                name: 'Get Metadata',
                                                value: 'getMetadata',
                                                description: 'Retrieve complete metadata for a Google Drive file',
                                        },
                                        {
                                                name: 'Get Content',
                                                value: 'getContent',
                                                description: 'Fetch the file content as a string (Docs→Markdown, Sheets→CSV, Slides→Plain Text)',
                                        },
                                ],
                                default: 'getMetadata',
                                description: 'The operation to perform',
                        },
                        {
                                displayName: 'Input Type',
                                name: 'inputType',
                                type: 'options',
                                options: [
                                        {
                                                name: 'File URL',
                                                value: 'url',
                                        },
                                        {
                                                name: 'File ID',
                                                value: 'id',
                                        },
                                ],
                                default: 'url',
                                description: 'Whether to provide a Google Drive file URL or file ID',
                        },
                        {
                                displayName: 'File URL',
                                name: 'fileUrl',
                                type: 'string',
                                displayOptions: {
                                        show: {
                                                inputType: ['url'],
                                        },
                                },
                                default: '',
                                required: true,
                                placeholder: 'https://drive.google.com/file/d/FILE_ID/view',
                                description: 'The Google Drive file URL',
                        },
                        {
                                displayName: 'File ID',
                                name: 'fileId',
                                type: 'string',
                                displayOptions: {
                                        show: {
                                                inputType: ['id'],
                                        },
                                },
                                default: '',
                                required: true,
                                placeholder: '1a2b3c4d5e6f7g8h9i0j',
                                description: 'The Google Drive file ID',
                        },
                ],
        };

        async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
                const items = this.getInputData();
                const returnData: INodeExecutionData[] = [];

                for (let i = 0; i < items.length; i++) {
                        try {
                                const operation = this.getNodeParameter('operation', i) as string;
                                const inputType = this.getNodeParameter('inputType', i) as string;

                                let fileId: string;

                                if (inputType === 'url') {
                                        const fileUrl = this.getNodeParameter('fileUrl', i) as string;
                                        fileId = extractFileIdFromUrl(fileUrl);
                                        if (!fileId) {
                                                throw new NodeOperationError(
                                                        this.getNode(),
                                                        `Invalid Google Drive URL: ${fileUrl}`,
                                                        { itemIndex: i },
                                                );
                                        }
                                } else {
                                        fileId = this.getNodeParameter('fileId', i) as string;
                                }

                                const metadataOptions = {
                                        method: 'GET' as const,
                                        url: `https://www.googleapis.com/drive/v3/files/${fileId}`,
                                        qs: {
                                                fields: '*',
                                                supportsAllDrives: true,
                                        },
                                        json: true,
                                };

                                const metadata = await this.helpers.requestOAuth2.call(
                                        this,
                                        'googleDriveOAuth2Api',
                                        metadataOptions,
                                ) as any;

                                if (operation === 'getMetadata') {
                                        returnData.push({
                                                json: metadata,
                                                pairedItem: { item: i },
                                        });
                                } else if (operation === 'getContent') {
                                        const mimeType = metadata.mimeType;
                                        const preferredMimeTypes = getExportMimeTypes(mimeType);

                                        if (!preferredMimeTypes) {
                                                throw new NodeOperationError(
                                                        this.getNode(),
                                                        `Unsupported file type: ${mimeType}. Only Google Docs, Sheets, and Slides are supported for content export.`,
                                                        { itemIndex: i },
                                                );
                                        }

                                        const exportLinks = metadata.exportLinks;
                                        if (!exportLinks) {
                                                throw new NodeOperationError(
                                                        this.getNode(),
                                                        `No export links available for this file. It may not be a Google Workspace document.`,
                                                        { itemIndex: i },
                                                );
                                        }

                                        const exportInfo = findAvailableExportLink(exportLinks, preferredMimeTypes);
                                        if (!exportInfo) {
                                                throw new NodeOperationError(
                                                        this.getNode(),
                                                        `No compatible export format available. Tried: ${preferredMimeTypes.join(', ')}`,
                                                        { itemIndex: i },
                                                );
                                        }

                                        const contentOptions = {
                                                method: 'GET' as const,
                                                url: exportInfo.url,
                                                json: false,
                                        };

                                        const content = await this.helpers.requestOAuth2.call(
                                                this,
                                                'googleDriveOAuth2Api',
                                                contentOptions,
                                        ) as string;

                                        returnData.push({
                                                json: {
                                                        fileId,
                                                        fileName: metadata.name,
                                                        mimeType,
                                                        exportFormat: exportInfo.mimeType,
                                                        content,
                                                },
                                                pairedItem: { item: i },
                                        });
                                }
                        } catch (error) {
                                if (this.continueOnFail()) {
                                        returnData.push({
                                                json: {
                                                        error: error.message,
                                                },
                                                pairedItem: { item: i },
                                        });
                                        continue;
                                }
                                throw error;
                        }
                }

                return [returnData];
        }
}
