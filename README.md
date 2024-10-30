![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# n8n-nodes-google-document-ai

This is an n8n community node. It lets you use Google Document AI in your n8n workflows.

Google Document AI is a cloud-based document processing service that uses machine learning to automatically extract text, tables, and other data from documents.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)  
[Version history](#version-history)  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

- Extract text from documents
- Extract tables from documents
- Extract entities from documents

## Credentials

To use this node, you need to authenticate with Google Cloud. You will need a Google Cloud Project with Document AI enabled and a service account key.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing project.
3. Enable the Document AI API for your project.
4. Create a service account and download the JSON key file.
5. In n8n, create new credentials for Google API and upload the JSON key file.

## Compatibility

This node is compatible with n8n version 0.150.0 and above. It has been tested with the latest version of n8n.

## Usage

This node allows you to process documents using Google Document AI. You can provide the document content as a binary file or a base64-encoded string. The node will return the extracted text, tables, and entities.

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
* [Google Document AI documentation](https://cloud.google.com/document-ai/docs)

## Version history

### 1.0.0
- Initial release of the Google Document AI node.

### 1.1.0
- Added support for extracting tables and entities from documents.

### 1.2.0
- Improved error handling and added compatibility with n8n version 0.150.0 and above.


