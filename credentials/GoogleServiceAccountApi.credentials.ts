import {
	ICredentialType,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

export class GoogleServiceAccountApi implements ICredentialType {
	name = 'googleServiceAccountApi';
	displayName = 'Google Service Account API';
	documentationUrl = 'https://cloud.google.com/iam/docs/creating-managing-service-account-keys';
	icon: Icon = 'file:icons/Google.svg';
	properties: INodeProperties[] = [
		{
			displayName: 'Service Account Key',
			name: 'serviceAccountKey',
			type: 'string',
			typeOptions: {
				password: true,
				rows: 10,
			},
			default: '',
			required: true,
			description: 'Enter the JSON key file contents from your Google service account',
		},
	];

} 