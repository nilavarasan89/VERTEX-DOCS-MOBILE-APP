/**
 * Vertex Docs Mobile - History Type Definitions
 * Company: JM Vertex Technologies
 */

export type HistoryItemType = 'conversion' | 'translation' | 'merge' | 'compression';

export interface HistoryItem {
  id: string;
  type: HistoryItemType;
  title: string;
  subtitle: string;
  sourceBadge: string;
  targetBadge: string;
  date: string;
  timestamp: number;
  status: 'completed' | 'failed';
  fileSizeFormatted?: string;
  resultUri?: string;
  resultFileName?: string;
  canTranslate?: boolean;
  meta?: {
    sourceLanguage?: string;
    targetLanguage?: string;
    sourceFormat?: string;
    targetFormat?: string;
    wordCount?: number;
  };
}
