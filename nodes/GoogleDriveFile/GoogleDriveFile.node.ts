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

interface ExtractedImage {
        id: string;
        format: string;
        data: string;
}

interface ImageExtractionResult {
        content: string;
        images: ExtractedImage[];
}

function extractImagesFromMarkdown(markdown: string, includeImages: boolean): ImageExtractionResult {
	const images: ExtractedImage[] = [];
	let imageIndex = 0;
	const referenceMap: { [key: string]: string } = {};

	const inlineImagePattern = /!\[([^\]]*)\]\(data:image\/([^;]+);base64,([A-Za-z0-9+/=]+)\)/g;
	const referenceImagePattern = /\[([^\]]+)\]:\s*<data:image\/([^;]+);base64,([A-Za-z0-9+/=]+)>/g;

	let cleanedContent = markdown.replace(referenceImagePattern, (match, refId, format, base64Data) => {
		const newImageId = `image-${imageIndex}`;
		referenceMap[refId] = newImageId;

		if (includeImages) {
			images.push({
				id: newImageId,
				format,
				data: base64Data,
			});
		}

		imageIndex++;
		return `[${refId}]: ${newImageId}`;
	});

	cleanedContent = cleanedContent.replace(inlineImagePattern, (match, alt, format, base64Data) => {
		const newImageId = `image-${imageIndex}`;

		if (includeImages) {
			images.push({
				id: newImageId,
				format,
				data: base64Data,
			});
		}

		imageIndex++;
		return `![${alt}](${newImageId})`;
	});

	return {
		content: cleanedContent,
		images,
	};
}

/**
 * Convert HTML from mobilebasic endpoint to Markdown
 * Preserves: headers, bold, italic, lists, links, blockquotes, and basic formatting
 */
function convertHtmlToMarkdown(html: string): string {
	let markdown = html;

	// Remove script, style, head, nav, header, footer, noscript tags
	markdown = markdown.replace(/<(script|style|head|nav|header|footer|noscript)[^>]*>[\s\S]*?<\/\1>/gi, '');

	// Headers (h1-h6) - must come before general tag removal
	markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
	markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
	markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
	markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
	markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
	markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');

	// Bold - <strong> or <b>
	markdown = markdown.replace(/<(strong|b)[^>]*>(.*?)<\/\1>/gi, '**$2**');

	// Italic - <em> or <i>
	markdown = markdown.replace(/<(em|i)[^>]*>(.*?)<\/\1>/gi, '*$2*');

	// Strikethrough
	markdown = markdown.replace(/<(strike|s|del)[^>]*>(.*?)<\/\1>/gi, '~~$2~~');

	// Code - inline
	markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

	// Links - <a href="url">text</a>
	markdown = markdown.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');

	// Unordered lists
	markdown = markdown.replace(/<ul[^>]*>/gi, '\n');
	markdown = markdown.replace(/<\/ul>/gi, '\n');
	
	// Ordered lists
	markdown = markdown.replace(/<ol[^>]*>/gi, '\n');
	markdown = markdown.replace(/<\/ol>/gi, '\n');
	
	// List items - use 1. for ordered (Markdown auto-numbers), - for unordered
	markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');

	// Blockquotes
	markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (match, content) => {
		const lines = content.trim().split('\n');
		return lines.map(line => `> ${line.trim()}`).join('\n') + '\n\n';
	});

	// Horizontal rules
	markdown = markdown.replace(/<hr[^>]*>/gi, '\n---\n\n');

	// Line breaks
	markdown = markdown.replace(/<br\s*\/?>/gi, '\n');

	// Paragraphs - add double newline for separation
	markdown = markdown.replace(/<\/p>/gi, '\n\n');
	markdown = markdown.replace(/<p[^>]*>/gi, '');

	// Divs - treat as paragraph breaks
	markdown = markdown.replace(/<\/div>/gi, '\n\n');
	markdown = markdown.replace(/<div[^>]*>/gi, '');

	// Tables (basic support)
	markdown = markdown.replace(/<table[^>]*>/gi, '\n');
	markdown = markdown.replace(/<\/table>/gi, '\n');
	markdown = markdown.replace(/<tr[^>]*>/gi, '|');
	markdown = markdown.replace(/<\/tr>/gi, '|\n');
	markdown = markdown.replace(/<t[hd][^>]*>(.*?)<\/t[hd]>/gi, ' $1 |');

	// Remove all remaining HTML tags
	markdown = markdown.replace(/<[^>]+>/g, '');

	// Decode HTML entities
	markdown = markdown
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&mdash;/g, '—')
		.replace(/&ndash;/g, '–')
		.replace(/&hellip;/g, '…')
		.replace(/&copy;/g, '©')
		.replace(/&reg;/g, '®')
		.replace(/&trade;/g, '™');

	// Clean up whitespace
	markdown = markdown.replace(/ +/g, ' '); // Multiple spaces to single
	markdown = markdown.replace(/\n\s*\n\s*\n+/g, '\n\n'); // Multiple newlines to double
	markdown = markdown.replace(/^\s+|\s+$/g, ''); // Trim start/end

	return markdown;
}

/**
 * Fallback method: Fetch content from mobilebasic endpoint and convert to Markdown
 * This works when exportLinks are not available or when permissions are restricted
 */
async function fetchMobileBasicContent(
	context: IExecuteFunctions,
	fileId: string,
): Promise<string> {
	const mobileBasicUrl = `https://docs.google.com/document/d/${fileId}/mobilebasic`;

	const options = {
		method: 'GET' as const,
		url: mobileBasicUrl,
		json: false,
	};

	try {
		const html = await context.helpers.requestOAuth2.call(
			context,
			'googleDriveOAuth2Api',
			options,
		) as string;

		// Check if we got a login/error page
		if (html.includes('Sign in') || html.includes('Logga in') || html.length < 500) {
			throw new Error('Received login page or insufficient content from mobilebasic endpoint');
		}

		// Convert HTML to Markdown
		const markdown = convertHtmlToMarkdown(html);

		if (markdown.length < 200) {
			throw new Error(`Extracted content too short (${markdown.length} chars) - may not have proper access`);
		}

		return markdown;
	} catch (error: any) {
		throw new Error(`MobileBasic fallback failed: ${error.message}`);
	}
}

export class GoogleDriveFile implements INodeType {
        description: INodeTypeDescription = {
                displayName: 'Google Drive File',
                name: 'googleDriveFile',
                icon: 'file:googledrive.svg',
                group: ['transform'],
                version: 1,
                subtitle: '={{$parameter["operation"]}}',
                description: 'Fetch Google Drive file metadata and content',
                defaults: {
                        name: 'Google Drive File',
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
				{
					displayName: 'Include Images',
					name: 'includeImages',
					type: 'boolean',
					displayOptions: {
						show: {
							operation: ['getContent'],
						},
					},
					default: false,
					description: 'Whether to extract and return images separately from the markdown content. WARNING: Images can make the output significantly larger, which may impact n8n performance.',
				},
				{
					displayName: 'Use MobileBasic Fallback',
					name: 'useMobileBasicFallback',
					type: 'boolean',
					displayOptions: {
						show: {
							operation: ['getContent'],
						},
					},
					default: true,
					description: 'Whether to fallback to mobilebasic endpoint if standard export fails. Useful for permission-restricted documents. Returns Markdown (no images).',
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
					const useMobileBasicFallback = this.getNodeParameter('useMobileBasicFallback', i, true) as boolean;

					if (!preferredMimeTypes) {
						throw new NodeOperationError(
							this.getNode(),
							`Unsupported file type: ${mimeType}. Only Google Docs, Sheets, and Slides are supported for content export.`,
							{ itemIndex: i },
						);
					}

					let finalContent: string;
					let exportFormat: string;
					let images: ExtractedImage[] = [];
					let usedFallback = false;

					// Try standard export first
					try {
						const exportLinks = metadata.exportLinks;
						if (!exportLinks) {
							throw new Error('No export links available');
						}

						const exportInfo = findAvailableExportLink(exportLinks, preferredMimeTypes);
						if (!exportInfo) {
							throw new Error(`No compatible export format available. Tried: ${preferredMimeTypes.join(', ')}`);
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

						const includeImages = this.getNodeParameter('includeImages', i, false) as boolean;
						const isMarkdownExport = exportInfo.mimeType === 'text/markdown' || exportInfo.mimeType === 'text/x-markdown';

						if (isMarkdownExport) {
							const extractionResult = extractImagesFromMarkdown(content, includeImages);
							finalContent = extractionResult.content;
							images = extractionResult.images;
						} else {
							finalContent = content;
						}

						exportFormat = exportInfo.mimeType;
					} catch (standardExportError: any) {
						// Standard export failed, try mobilebasic fallback if enabled
						if (useMobileBasicFallback && mimeType === 'application/vnd.google-apps.document') {
							try {
								finalContent = await fetchMobileBasicContent(this, fileId);
								exportFormat = 'text/markdown (via mobilebasic)';
								usedFallback = true;
							} catch (fallbackError: any) {
								throw new NodeOperationError(
									this.getNode(),
									`Both standard export and mobilebasic fallback failed. Standard: ${standardExportError.message}. Fallback: ${fallbackError.message}`,
									{ itemIndex: i },
								);
							}
						} else {
							// Fallback not enabled or not applicable
							throw new NodeOperationError(
								this.getNode(),
								`Content export failed: ${standardExportError.message}. ${mimeType === 'application/vnd.google-apps.document' && !useMobileBasicFallback ? 'Try enabling MobileBasic Fallback option.' : ''}`,
								{ itemIndex: i },
							);
						}
					}

					const outputJson: any = {
						fileId,
						fileName: metadata.name,
						mimeType,
						exportFormat,
						modifiedTime: metadata.modifiedTime,
						content: finalContent,
						usedFallback,
					};

					const includeImages = this.getNodeParameter('includeImages', i, false) as boolean;
					if (includeImages && images.length > 0) {
						outputJson.images = images;
					}

					returnData.push({
						json: outputJson,
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
