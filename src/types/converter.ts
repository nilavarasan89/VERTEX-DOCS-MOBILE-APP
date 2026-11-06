/**
 * Vertex Docs Mobile - Document Converter Type Definitions
 * Company: JM Vertex Technologies
 */

export type SourceFormat = 'pdf' | 'docx' | 'pptx' | 'jpg' | 'png' | 'txt' | 'xlsx';

export type TargetFormat = 'pdf' | 'docx' | 'pptx' | 'txt' | 'jpg' | 'png' | 'csv' | 'webp';

export type ConversionStatus =
  | 'idle'
  | 'validating'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ConversionOption {
  format: TargetFormat;
  label: string;
  extension: string;
  icon: string;
  badge?: string;
  description: string;
  mimeType: string;
  estimatedTimeSec: number;
}

export interface SelectedFile {
  uri: string;
  name: string;
  size: number; // in bytes
  sizeFormatted: string;
  format: SourceFormat;
  mimeType?: string;
  lastModified?: number;
  isMock?: boolean;
}

export interface ConversionJob {
  id: string;
  fileName: string;
  fileUri: string;
  fileSize: number;
  fileSizeFormatted: string;
  sourceFormat: SourceFormat;
  targetFormat: TargetFormat;
  status: ConversionStatus;
  progress: number; // 0 to 100
  currentStepText: string;
  resultUri?: string;
  resultFileName?: string;
  resultSize?: number;
  resultSizeFormatted?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
  canTranslate?: boolean;
}
