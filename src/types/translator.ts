/**
 * Vertex Docs Mobile - Document Translator Type Definitions
 * Company: JM Vertex Technologies
 */

export type LanguageCode =
  | 'auto'
  | 'ta' // Tamil
  | 'en' // English
  | 'hi' // Hindi
  | 'te' // Telugu
  | 'ml' // Malayalam
  | 'kn' // Kannada
  | 'ar' // Arabic
  | 'fr' // French
  | 'de' // German
  | 'es'; // Spanish

export interface LanguageItem {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  isPopular?: boolean;
  supportsOcr?: boolean;
}

export type TranslationStatus =
  | 'idle'
  | 'extracting'
  | 'translating'
  | 'completed'
  | 'failed';

export interface DocumentSection {
  id: string;
  type: 'heading' | 'paragraph' | 'list_item' | 'table_row';
  originalText: string;
  translatedText: string;
}

export interface TranslationJob {
  id: string;
  docId?: string;
  title: string;
  sourceUri?: string;
  sourceFormat?: string;
  sourceLanguage: LanguageCode;
  detectedLanguage?: LanguageCode;
  targetLanguage: LanguageCode;
  originalText: string;
  translatedText: string;
  sections: DocumentSection[];
  status: TranslationStatus;
  progress: number; // 0 to 100
  currentStepText: string;
  wordCount: number;
  characterCount: number;
  ocrApplied?: boolean;
  ocrConfidence?: number; // e.g. 98.4
  resultUri?: string;
  resultFileName?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}
