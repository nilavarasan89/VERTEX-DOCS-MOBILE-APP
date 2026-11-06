/**
 * Vertex Docs Mobile - Document Translator Service
 * Company: JM Vertex Technologies
 * 
 * Supports genuine multilingual translation across:
 * Tamil (ta), English (en), Hindi (hi), Telugu (te), Malayalam (ml),
 * Kannada (kn), Arabic (ar), French (fr), German (de), Spanish (es).
 * 
 * Multi-Provider Architecture:
 * 1. Google Neural Translation Engine (Primary - High-speed, fluent Tamil Unicode)
 * 2. Enterprise Google Cloud API (Custom Key option)
 * 3. MyMemory Multi-Language Service (Secondary fallback)
 */

import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import {
  TranslationJob,
  TranslationStatus,
  LanguageCode,
  DocumentSection,
} from '../types/translator';
import { detectLanguageFromText, getLanguageByCode } from '../constants/languages';
import { historyService } from './historyService';
import { docxService } from './docxService';
import { pdfService } from './pdfService';
import { TRANSLATION_CONFIG } from './apiConfig';

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#([0-9]{1,5});/gi, (match, numStr) => {
      const num = parseInt(numStr, 10);
      return String.fromCharCode(num);
    });
}

class TranslatorService {
  /**
   * Translates arbitrary sentences using multi-tier translation pipeline.
   * Handles UTF-8 Unicode for Tamil and all target languages.
   */
  public async translateText(
    text: string,
    source: LanguageCode,
    target: LanguageCode
  ): Promise<string> {
    const srcCode = source === 'auto' ? detectLanguageFromText(text) : source;
    const tgtCode = target;

    if (srcCode === tgtCode) {
      return text;
    }

    const trimmed = text.trim();
    if (!trimmed) return '';

    // Split into sentences / paragraphs so chunks stay within API size limits
    const chunks = this.splitIntoChunks(trimmed, 400);
    const translatedChunks: string[] = [];

    for (const chunk of chunks) {
      const translatedChunk = await this.translateSingleChunk(chunk, srcCode, tgtCode);
      translatedChunks.push(translatedChunk);
    }

    return translatedChunks.join(' ');
  }

  /**
   * Helper to translate a single chunk using Google Neural Engine (GTX)
   */
  private async translateWithGoogle(
    chunk: string,
    source: LanguageCode,
    target: LanguageCode
  ): Promise<string> {
    const encoded = encodeURIComponent(chunk);
    const sl = source === 'auto' ? 'auto' : source;
    const tl = target;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encoded}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14) VertexDocs/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Google Translation Engine returned HTTP ${response.status}`);
    }

    const data = await response.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = data[0]
        .map((item: any) => (item && item[0] ? item[0] : ''))
        .join('');
      if (translated && translated.trim().length > 0) {
        return decodeHtmlEntities(translated);
      }
    }

    throw new Error('Google Translation Engine returned unparseable translation payload');
  }

  /**
   * Helper to translate using Custom Google Cloud API Key
   */
  private async translateWithCustomKey(
    chunk: string,
    source: LanguageCode,
    target: LanguageCode,
    apiKey: string
  ): Promise<string> {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: chunk,
        source: source === 'auto' ? undefined : source,
        target,
        format: 'text',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`Custom Cloud API error: HTTP ${response.status}`);
    }

    const data = await response.json();
    const translated = data?.data?.translations?.[0]?.translatedText;
    if (translated) {
      return decodeHtmlEntities(translated);
    }
    throw new Error('Custom Cloud API returned empty translation');
  }

  /**
   * Helper to translate a single chunk using MyMemory API
   */
  private async translateWithMyMemory(
    chunk: string,
    source: LanguageCode,
    target: LanguageCode
  ): Promise<string> {
    const encoded = encodeURIComponent(chunk);
    const sl = source === 'auto' ? 'en' : source;
    const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=${sl}|${target}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`MyMemory returned HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data && data.responseData && data.responseData.translatedText) {
      const decoded = decodeHtmlEntities(data.responseData.translatedText);
      if (decoded.includes('MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS')) {
        throw new Error('MyMemory quota exceeded');
      }
      return decoded;
    }

    throw new Error(data?.responseDetails || 'MyMemory empty translation');
  }

  /**
   * Multi-provider single chunk translation with automatic fallback
   */
  private async translateSingleChunk(
    chunk: string,
    source: LanguageCode,
    target: LanguageCode
  ): Promise<string> {
    // 1. If custom API key configured, use that
    if (TRANSLATION_CONFIG.provider === 'custom' && TRANSLATION_CONFIG.customApiKey) {
      try {
        return await this.translateWithCustomKey(
          chunk,
          source,
          target,
          TRANSLATION_CONFIG.customApiKey
        );
      } catch (customErr) {
        console.warn('Custom API Key failed, falling back:', customErr);
        if (!TRANSLATION_CONFIG.fallbackEnabled) throw customErr;
      }
    }

    // 2. Primary Provider: Google Neural Translation Engine
    try {
      return await this.translateWithGoogle(chunk, source, target);
    } catch (googleErr: any) {
      console.warn('Google Translation Engine failed, trying MyMemory fallback:', googleErr?.message);
    }

    // 3. Fallback Provider: MyMemory
    try {
      return await this.translateWithMyMemory(chunk, source, target);
    } catch (myMemoryErr: any) {
      console.warn('MyMemory fallback failed:', myMemoryErr?.message);
    }

    throw new Error(
      'Translation engine could not connect to online service. Please ensure your device has an active internet connection.'
    );
  }

  private splitIntoChunks(text: string, maxLen: number): string[] {
    const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
    const chunks: string[] = [];
    let current = '';

    for (const sentence of sentences) {
      if ((current + sentence).length > maxLen && current.length > 0) {
        chunks.push(current.trim());
        current = sentence;
      } else {
        current += sentence;
      }
    }

    if (current.trim().length > 0) {
      chunks.push(current.trim());
    }

    return chunks;
  }

  /**
   * Primary entry point for DocumentTranslatorScreen
   */
  public async translateDocument(
    title: string,
    rawText: string,
    sourceLanguage: LanguageCode,
    targetLanguage: LanguageCode,
    onProgress: (job: TranslationJob) => void,
    sourceUri?: string,
    sourceFormat?: string
  ): Promise<TranslationJob> {
    return this.startTranslation(
      title,
      rawText,
      sourceLanguage,
      targetLanguage,
      sourceUri,
      sourceFormat,
      onProgress
    );
  }

  /**
   * Execute full document translation lifecycle with progressive status reporting
   */
  public async startTranslation(
    title: string,
    rawText: string | undefined,
    sourceLanguage: LanguageCode,
    targetLanguage: LanguageCode,
    sourceUri: string | undefined,
    sourceFormat: string | undefined,
    onProgress: (job: TranslationJob) => void
  ): Promise<TranslationJob> {
    const jobId = 'trans_' + Date.now();
    const effectiveSource =
      sourceLanguage === 'auto'
        ? detectLanguageFromText(rawText || '')
        : sourceLanguage;

    const job: TranslationJob = {
      id: jobId,
      title: title || 'Untitled Document',
      sourceUri,
      sourceFormat,
      sourceLanguage: effectiveSource,
      targetLanguage,
      originalText: rawText || '',
      translatedText: '',
      sections: [],
      status: 'extracting',
      progress: 10,
      currentStepText: 'Reading and parsing source document structure...',
      wordCount: 0,
      characterCount: 0,
      createdAt: new Date().toISOString(),
    };

    onProgress({ ...job });

    let sourceContent = rawText || '';

    // Step 1: If text is missing and URI exists, extract from document
    if (!sourceContent.trim() && sourceUri) {
      try {
        const ext = sourceFormat?.toLowerCase() || sourceUri.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') {
          job.currentStepText = 'Inspecting PDF streams and text layers...';
          onProgress({ ...job });

          const pdfResult = await pdfService.extractTextFromPdf(sourceUri);
          if (pdfResult.isScanned) {
            job.status = 'failed';
            job.errorMessage =
              'Scanned PDF detected. This document contains scanned images without selectable text. An OCR engine or backend service is required to transcribe images.';
            onProgress({ ...job });
            return job;
          }
          sourceContent = pdfResult.text;
        } else if (ext === 'docx') {
          job.currentStepText = 'Parsing Word OpenXML paragraph structures...';
          onProgress({ ...job });
          sourceContent = await docxService.extractTextFromDocx(sourceUri);
        } else if (ext === 'txt') {
          sourceContent = await FileSystem.readAsStringAsync(sourceUri, {
            encoding: FileSystem.EncodingType.UTF8,
          });
        }
      } catch (extractErr: any) {
        job.status = 'failed';
        job.errorMessage = `Could not extract text: ${extractErr?.message || extractErr}`;
        onProgress({ ...job });
        return job;
      }
    }

    if (!sourceContent.trim()) {
      job.status = 'failed';
      job.errorMessage = 'No extractable text found in the document to translate.';
      onProgress({ ...job });
      return job;
    }

    job.originalText = sourceContent;
    job.wordCount = sourceContent.split(/\s+/).filter(Boolean).length;
    job.characterCount = sourceContent.length;

    // Step 2: Segment text into sections
    job.status = 'translating';
    job.progress = 25;
    job.currentStepText = 'Segmenting document into semantic paragraphs and headings...';
    onProgress({ ...job });

    const rawSections = this.segmentDocument(sourceContent);
    const translatedSections: DocumentSection[] = [];

    // Step 3: Progressive translation per section
    const totalSections = rawSections.length;
    for (let i = 0; i < totalSections; i++) {
      const section = rawSections[i];
      const percent = Math.round(25 + ((i + 1) / totalSections) * 60);

      job.progress = percent;
      job.currentStepText = `Translating section ${i + 1} of ${totalSections} to ${getLanguageByCode(targetLanguage).name}...`;
      onProgress({ ...job });

      try {
        const translatedContent = await this.translateText(
          section.originalText,
          effectiveSource,
          targetLanguage
        );

        translatedSections.push({
          ...section,
          translatedText: translatedContent,
        });
      } catch (secErr: any) {
        job.status = 'failed';
        job.errorMessage = `Translation failed: ${secErr?.message || secErr}`;
        onProgress({ ...job });
        historyService.addFromTranslation(job);
        return job;
      }
    }

    const fullTranslatedText = translatedSections.map((s) => s.translatedText).join('\n\n');

    job.sections = translatedSections;
    job.translatedText = fullTranslatedText;
    job.status = 'completed';
    job.progress = 100;
    job.currentStepText = 'Translation successfully completed!';
    job.completedAt = new Date().toISOString();

    // Export a default TXT copy
    try {
      const targetLangName = getLanguageByCode(targetLanguage).name;
      const baseTitle = job.title.replace(/\.[^/.]+$/, '');
      const outFileName = `${baseTitle}_${targetLangName}_Translated.txt`;
      const outDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
      const outPath = `${outDir}${outFileName}`;

      await FileSystem.writeAsStringAsync(outPath, fullTranslatedText, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      job.resultUri = outPath;
      job.resultFileName = outFileName;
    } catch (writeErr) {
      console.warn('Could not save default text translation result:', writeErr);
    }

    historyService.addFromTranslation(job);
    onProgress({ ...job });
    return job;
  }

  /**
   * Exports translated document into DOCX, PDF, or TXT
   */
  public async exportTranslatedDocument(
    job: TranslationJob,
    format: 'txt' | 'docx' | 'pdf'
  ): Promise<{ uri: string; size: number; fileName: string }> {
    const targetLangName = getLanguageByCode(job.targetLanguage).name;
    const baseTitle = job.title.replace(/\.[^/.]+$/, '');
    const outFileName = `${baseTitle}_${targetLangName}_Translated.${format}`;
    const paragraphs = job.translatedText.split(/\r?\n\r?\n/).filter(Boolean);

    if (format === 'docx') {
      return await docxService.generateDocx(paragraphs, {
        title: `${job.title} (${targetLangName} Translation)`,
        fileName: outFileName,
      });
    } else if (format === 'pdf') {
      return await pdfService.createPdfFromText(job.translatedText, {
        title: `${job.title} (${targetLangName} Translation)`,
        fileName: outFileName,
      });
    } else {
      const outDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
      const outPath = `${outDir}${outFileName}`;
      await FileSystem.writeAsStringAsync(outPath, job.translatedText, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const info = await FileSystem.getInfoAsync(outPath);
      return {
        uri: outPath,
        size: info.exists && 'size' in info ? info.size : job.translatedText.length,
        fileName: outFileName,
      };
    }
  }

  /**
   * Share translated document using system share sheet
   */
  public async shareTranslation(job: TranslationJob): Promise<boolean> {
    if (!job.resultUri && !job.translatedText) return false;
    try {
      if (job.resultUri) {
        await this.shareDocument(job.resultUri, job.title);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Share translated document using system share sheet
   */
  public async shareDocument(uri: string, title?: string): Promise<void> {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Sharing is not available on this device');
    }
    await Sharing.shareAsync(uri, {
      mimeType: uri.endsWith('.pdf')
        ? 'application/pdf'
        : uri.endsWith('.docx')
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'text/plain',
      dialogTitle: title || 'Share Translated Document',
    });
  }

  private segmentDocument(text: string): DocumentSection[] {
    const rawBlocks = text.split(/\r?\n\r?\n/);
    const sections: DocumentSection[] = [];

    rawBlocks.forEach((block, index) => {
      const trimmed = block.trim();
      if (!trimmed) return;

      const isHeading =
        trimmed.startsWith('#') ||
        (trimmed === trimmed.toUpperCase() && trimmed.length < 60 && !trimmed.includes('.'));

      const isListItem =
        /^(\d+[\.\)]|[-*•])\s+/.test(trimmed);

      let type: DocumentSection['type'] = 'paragraph';
      if (isHeading) type = 'heading';
      else if (isListItem) type = 'list_item';

      sections.push({
        id: `sec_${index}_${Date.now()}`,
        type,
        originalText: trimmed,
        translatedText: '',
      });
    });

    return sections;
  }
}

export const translatorService = new TranslatorService();
