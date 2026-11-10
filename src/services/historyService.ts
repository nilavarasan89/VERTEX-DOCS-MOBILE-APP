/**
 * Vertex Docs Mobile - History Service
 * Company: JM Vertex Technologies
 */

import { HistoryItem, HistoryItemType } from '../types/history';
import { ConversionJob } from '../types/converter';
import { TranslationJob } from '../types/translator';
import { getLanguageByCode } from '../constants/languages';

class HistoryService {
  private history: HistoryItem[] = [];

  public getAll(): HistoryItem[] {
    return [...this.history].sort((a, b) => b.timestamp - a.timestamp);
  }

  public getByType(type: HistoryItemType | 'all'): HistoryItem[] {
    if (type === 'all') return this.getAll();
    return this.getAll().filter((item) => item.type === type);
  }

  public addFromConversion(job: ConversionJob): HistoryItem {
    const item: HistoryItem = {
      id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      type: 'conversion',
      title: job.fileName,
      subtitle: `Converted to ${job.targetFormat.toUpperCase()}`,
      sourceBadge: job.sourceFormat.toUpperCase(),
      targetBadge: job.targetFormat.toUpperCase(),
      date: 'Just now',
      timestamp: Date.now(),
      status: job.status === 'completed' ? 'completed' : 'failed',
      fileSizeFormatted: job.resultSizeFormatted || job.fileSizeFormatted,
      resultUri: job.resultUri,
      resultFileName: job.resultFileName,
      canTranslate: job.status === 'completed',
      meta: {
        sourceFormat: job.sourceFormat,
        targetFormat: job.targetFormat,
      },
    };

    this.history.unshift(item);
    return item;
  }

  public addFromTranslation(job: TranslationJob): HistoryItem {
    const srcLang = getLanguageByCode(job.sourceLanguage).name;
    const tgtLang = getLanguageByCode(job.targetLanguage).name;

    const item: HistoryItem = {
      id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      type: 'translation',
      title: job.title,
      subtitle: `${srcLang} to ${tgtLang} translation`,
      sourceBadge: job.sourceLanguage.toUpperCase(),
      targetBadge: job.targetLanguage.toUpperCase(),
      date: 'Just now',
      timestamp: Date.now(),
      status: job.status === 'completed' ? 'completed' : 'failed',
      fileSizeFormatted: `${job.wordCount} words`,
      resultUri: job.resultUri,
      resultFileName: job.resultFileName,
      canTranslate: false,
      meta: {
        sourceLanguage: srcLang,
        targetLanguage: tgtLang,
        wordCount: job.wordCount,
      },
    };

    this.history.unshift(item);
    return item;
  }

  public removeItem(id: string): void {
    this.history = this.history.filter((item) => item.id !== id);
  }

  public clearAll(): void {
    this.history = [];
  }

  public clear(): void {
    this.clearAll();
  }

  public addRecord(item: {
    type?: HistoryItemType;
    title: string;
    sourceFormat?: string;
    targetFormat?: string;
    status?: 'completed' | 'failed';
    fileSize?: number;
    fileSizeFormatted?: string;
    uri?: string;
    meta?: any;
  }): HistoryItem {
    const record: HistoryItem = {
      id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      type: item.type || 'conversion',
      title: item.title,
      subtitle: item.type === 'merge' ? 'Merged Document' : 'Compressed File',
      sourceBadge: item.sourceFormat ? item.sourceFormat.toUpperCase() : 'DOC',
      targetBadge: item.targetFormat ? item.targetFormat.toUpperCase() : 'PDF',
      date: 'Just now',
      timestamp: Date.now(),
      status: item.status || 'completed',
      fileSizeFormatted: item.fileSizeFormatted || '1.0 MB',
      resultUri: item.uri,
      resultFileName: item.title,
      canTranslate: false,
      meta: item.meta,
    };
    this.history.unshift(record);
    return record;
  }
}

export const historyService = new HistoryService();
