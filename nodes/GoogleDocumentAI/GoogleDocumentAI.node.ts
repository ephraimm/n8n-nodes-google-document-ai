import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai/build/src/v1beta3';

export class GoogleDocumentAI implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Google Document AI OCR',
		name: 'googleDocumentAI',
		group: ['transform'],
		version: 1,
		description: 'Extract text from documents using Google Document AI OCR',
		defaults: {
			name: 'Google Document AI OCR',
			color: '#4285F4',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'googleApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Project ID',
				name: 'projectId',
				type: 'string',
				default: '',
				required: true,
				description: 'Google Cloud Project ID where Document AI is enabled',
			},
			{
				displayName: 'Location',
				name: 'location',
				type: 'options',
				options: [
					{
						name: 'United States',
						value: 'us',
					},
					{
						name: 'European Union',
						value: 'eu',
					},
				],
				default: 'us',
				description: 'Location of the Document AI processor',
			},
			{
				displayName: 'Processor ID',
				name: 'processorId',
				type: 'string',
				default: '',
				required: true,
				description: 'ID of the Document AI processor to use',
			},
			{
				displayName: 'Input Type',
				name: 'inputType',
				type: 'options',
				options: [
					{
						name: 'Binary File',
						value: 'binaryFile',
					},
					{
						name: 'Base64 String',
						value: 'base64',
					},
				],
				default: 'binaryFile',
				description: 'How the document data will be provided',
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						inputType: ['binaryFile'],
					},
				},
				description: 'Name of the binary property containing the document file',
			},
			{
				displayName: 'Base64 Content',
				name: 'base64Content',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						inputType: ['base64'],
					},
				},
				description: 'Base64-encoded content of the document',
			},
		],
	};

	private getText(textAnchor: any, text: string): string {
		if (!textAnchor.textSegments || textAnchor.textSegments.length === 0) {
			return '';
		}

		const startIndex = textAnchor.textSegments[0].startIndex || 0;
		const endIndex = textAnchor.textSegments[0].endIndex;

		return text.substring(startIndex, endIndex);
	}

	private processPageData(page: any, fullText: string) {
		return {
			pageNumber: page.pageNumber,
			dimension: {
				width: page.dimension.width,
				height: page.dimension.height,
			},
			detectedLanguages: page.detectedLanguages.map((lang: any) => ({
				languageCode: lang.languageCode,
				confidence: lang.confidence,
			})),
			paragraphs: page.paragraphs.map((para: any) => ({
				text: this.getText(para.layout.textAnchor, fullText),
			})),
			blocks: page.blocks.map((block: any) => ({
				text: this.getText(block.layout.textAnchor, fullText),
			})),
			lines: page.lines.map((line: any) => ({
				text: this.getText(line.layout.textAnchor, fullText),
			})),
			tokens: page.tokens.map((token: any) => ({
				text: this.getText(token.layout.textAnchor, fullText),
				breakType: token.detectedBreak?.type,
			})),
		};
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				// Get parameters
				const projectId = this.getNodeParameter('projectId', itemIndex) as string;
				const location = this.getNodeParameter('location', itemIndex) as string;
				const processorId = this.getNodeParameter('processorId', itemIndex) as string;
				const inputType = this.getNodeParameter('inputType', itemIndex) as string;

				// Get document content based on input type
				let documentContent: string;
				let mimeType: string;

				if (inputType === 'binaryFile') {
					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
					const binaryData = this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
					documentContent = binaryData.data;
					mimeType = binaryData.mimeType;
				} else {
					documentContent = this.getNodeParameter('base64Content', itemIndex) as string;
					// Attempt to determine mime type from base64 header or default to PDF
					mimeType = documentContent.startsWith('/9j/') ? 'image/jpeg' : 
						documentContent.startsWith('iVBORw0KGgo') ? 'image/png' : 
						'application/pdf';
				}

				// Initialize Document AI client
				const client = new DocumentProcessorServiceClient();
				const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;

				// Process document
				const [result] = await client.processDocument({
					name,
					rawDocument: {
						content: documentContent,
						mimeType,
					},
				});

				const { document } = result;
				const { text } = document;

				const processedData = {
					text,
					pageCount: document.pages.length,
					pages: document.pages.map((page: any) => this.processPageData(page, text)),
					entities: document.entities,
				};

				returnData.push({
					json: processedData,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
						},
						pairedItem: itemIndex,
					});
				} else {
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return [returnData];
	}
} 