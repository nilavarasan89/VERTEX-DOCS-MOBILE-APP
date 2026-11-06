/**
 * Vertex Docs Mobile - Backend API Configuration & Contract Specifications
 * Company: JM Vertex Technologies
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

export type TranslationProvider = 'google' | 'mymemory' | 'custom';

export interface TranslationApiConfig {
  provider: TranslationProvider;
  customApiKey: string;
  customEndpoint: string;
  fallbackEnabled: boolean;
}

export const TRANSLATION_CONFIG: TranslationApiConfig = {
  provider: 'google', // Default: Google Neural Engine (Ultra-reliable & high fidelity for Tamil)
  customApiKey: '',
  customEndpoint: '',
  fallbackEnabled: true,
};

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
