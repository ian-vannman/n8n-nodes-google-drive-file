import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

function extractFileIdFromUrl(url: string): string | null {
	const patterns = [
		/\/file\/d\/([a-zA-Z0-9_-]+)/,
		/id=([a-zA-Z0-9_-]+)/,
		/\/folders\/([a-zA-Z0-9_-]+)/,
		/^([a-zA-Z0-9_-]+)$/,
	];

	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match && match[1]) {
			return match[1];
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

				const options = {
					method: 'GET' as const,
					url: `https://www.googleapis.com/drive/v3/files/${fileId}`,
					qs: {
						fields: '*',
						supportsAllDrives: true,
					},
					json: true,
				};

				const response = await this.helpers.requestOAuth2.call(
					this,
					'googleDriveOAuth2Api',
					options,
				);

				returnData.push({
					json: response as any,
					pairedItem: { item: i },
				});
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
