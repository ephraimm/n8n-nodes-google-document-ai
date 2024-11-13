import type {
	IExecuteFunctions,
	IExecuteFunctionsLocal,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import vision from '@google-cloud/vision';

// Extend the IExecuteFunctionsLocal interface to include custom methods
declare module 'n8n-workflow' {
	interface IExecuteFunctionsLocal extends IExecuteFunctions {
		processPageData(page: any, fullText: string): any;
		getText(textAnchor: any, text: string): string;
	}
}

export class GoogleDocumentAI implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Google Document AI OCR',
		name: 'googleDocumentAi',
		icon: 'file:icons/google-vision-ai.svg',
		group: ['transform'],
		version: 1,
		description: 'Extract text from documents using Google Document AI OCR',
		defaults: {
			name: 'Google Document AI OCR',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'googleServiceAccount',
				required: true,
			},
		],
		// Node properties define the UI configuration and input parameters
		properties: [
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
						name: 'File Path', 
						value: 'filePath',
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
				displayName: 'File Path',
				name: 'filePath',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						inputType: ['filePath']
					}
				},
				description: 'Path to the document file',
			}
		],
	};

	/**
	 * Main execution method for the node
	 */
	async execute(this: IExecuteFunctionsLocal): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Initialize Google Vision client with service account credentials
		const credentials = await this.getCredentials('googleServiceAccount');
		const serviceAccountKey = JSON.parse(credentials.serviceAccountKey as string);
		const client = new vision.ImageAnnotatorClient({
			credentials: serviceAccountKey
		});

		let result: any;

		// Process each input item
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const inputType = this.getNodeParameter('inputType', itemIndex) as string;

				// Handle different input types
				if (inputType === 'binaryFile') {
					// Process binary file input
					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
					const buffer = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
					[result] = await client.textDetection(buffer);
				} else {
					// Process file path input
					const filePath = this.getNodeParameter('filePath', itemIndex) as string;
					[result] = await client.textDetection(filePath);
				}

				// Extract and validate text annotations
				const { textAnnotations } = result;
				if (!textAnnotations || typeof textAnnotations[0]?.description !== 'string') {
					throw new NodeOperationError(this.getNode(), 'Document or document text is invalid');
				}

				// Format and return the extracted text annotations
				returnData.push({
					json: {
						textAnnotations: textAnnotations.map((annotation: any) => ({
							mid: annotation?.mid,
							locale: annotation?.locale,
							description: annotation?.description,
							score: annotation?.score,
							confidence: annotation?.confidence,
							topicality: annotation?.topicality,
							boundingPoly: annotation?.boundingPoly,
							locations: annotation?.locations,
							properties: annotation?.properties,
						}))
					},
				});

			} catch (error) {
				// Handle errors based on continueOnFail setting
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
						description: `Error: ${error.message}`,
					});
				}
			}
		}

		return [returnData];
	}
}