/**
 * Vertex Docs Mobile - Backend API Configuration & Contract Specifications
 * Company: JM Vertex Technologies
 * 
 * Note: If external server endpoints are offline or unconfigured, the app
 * uses the built-in local client & engine without disruption.
 */

export interface ApiEnvironment {
  name: 'production' | 'staging' | 'local_mock';
  baseUrl: string;
  timeoutMs: number;
  useRemoteBackend: boolean;
}

export const API_CONFIG: ApiEnvironment = {
  name: 'production',
  baseUrl: 'https://api.vertexdocs.jmvertex.com/v1',
  timeoutMs: 30000,
  useRemoteBackend: false, // Set to true when backend API gateway is provisioned
};

/**
 * REST API Endpoints Specification:
 * 
 * 1. POST /documents/convert
 *    - Content-Type: multipart/form-data
 *    - Payload:
 *        file: File Binary
 *        sourceFormat: 'pdf' | 'docx' | 'pptx' | 'jpg' | 'png' | 'txt'
 *        targetFormat: 'pdf' | 'docx' | 'pptx' | 'jpg' | 'png' | 'txt'
 *        options: { preserveLayout: boolean, ocrScanned: boolean, compressionLevel: 'standard' | 'high' }
 *    - Response:
 *        {
 *          jobId: string;
 *          status: 'completed' | 'processing';
 *          resultUrl: string;
 *          resultFileName: string;
 *          resultSize: number;
 *          timeTakenMs: number;
 *        }
 * 
 * 2. POST /documents/translate
 *    - Content-Type: application/json
 *    - Payload:
 *        {
 *          text?: string;
 *          documentId?: string;
 *          sourceLanguage: 'auto' | 'ta' | 'en' | 'hi' | 'te' | 'ml' | ...;
 *          targetLanguage: 'ta' | 'en' | 'hi' | 'te' | 'ml' | ...;
 *          domain: 'general' | 'legal' | 'technical' | 'business';
 *        }
 *    - Response:
 *        {
 *          translationId: string;
 *          detectedSourceLanguage: string;
 *          targetLanguage: string;
 *          translatedText: string;
 *          wordCount: number;
 *          characterCount: number;
 *          sections: Array<{ id: string; type: string; original: string; translated: string }>;
 *          confidenceScore: number;
 *        }
 * 
 * 3. POST /documents/extract-text
 *    - Content-Type: multipart/form-data
 *    - Payload: file
 *    - Response: { text: string; pages: number; ocrApplied: boolean; wordCount: number }
 */

export interface ApiConvertRequest {
  fileName: string;
  sourceFormat: string;
  targetFormat: string;
  fileSize: number;
  fileUri: string;
}

export interface ApiConvertResponse {
  jobId: string;
  status: 'completed' | 'failed';
  resultFileName: string;
  resultUri: string;
  resultSize: number;
  timeTakenMs: number;
  errorMessage?: string;
}

export interface ApiTranslateRequest {
  text: string;
  documentTitle?: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface ApiTranslateResponse {
  translationId: string;
  detectedSourceLanguage: string;
  targetLanguage: string;
  translatedText: string;
  wordCount: number;
  confidenceScore: number;
  sections: Array<{
    id: string;
    type: 'heading' | 'paragraph' | 'list_item';
    originalText: string;
    translatedText: string;
  }>;
}
