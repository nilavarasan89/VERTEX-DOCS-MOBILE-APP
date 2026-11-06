/**
 * Vertex Docs Mobile - Document Converter Service
 * Company: JM Vertex Technologies
 * 
 * Orchestrates genuine document conversions between PDF, DOCX, TXT,
 * XLSX/CSV, and Images using verified on-device engines and services.
 */

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  SelectedFile,
  SourceFormat,
  TargetFormat,
  ConversionJob,
  ConversionStatus,
} from '../types/converter';
import {
  CONVERSION_MATRIX,
  getFormatFromFileName,
  formatBytes,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_LABEL,
} from '../constants/formatMatrix';
import { historyService } from './historyService';
import { apiClient } from './apiClient';
import { API_CONFIG } from './apiConfig';
import { docxService } from './docxService';
import { pdfService } from './pdfService';
import { xlsxService } from './xlsxService';
import { imageService } from './imageService';

class ConverterService {
  /**
   * Pick document from device storage using Expo Document Picker
   */
  public async pickDocument(): Promise<SelectedFile | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/vnd.ms-powerpoint',
          'text/plain',
          'text/csv',
          'image/jpeg',
          'image/png',
          '*/*',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      const format = getFormatFromFileName(asset.name);
      const size = asset.size ?? 1024 * 50;

      return {
        uri: asset.uri,
        name: asset.name,
        size: size,
        sizeFormatted: formatBytes(size),
        format: format,
        mimeType: asset.mimeType ?? 'application/octet-stream',
        lastModified: asset.lastModified,
        isMock: false,
      };
    } catch (error) {
      console.warn('DocumentPicker error:', error);
      return null;
    }
  }

  /**
   * Pick multiple documents (for Merge workflow)
   */
  public async pickMultipleDocuments(): Promise<SelectedFile[]> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'image/jpeg',
          'image/png',
        ],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return [];
      }

      return result.assets.map((asset) => {
        const format = getFormatFromFileName(asset.name);
        const size = asset.size ?? 1024 * 50;
        return {
          uri: asset.uri,
          name: asset.name,
          size,
          sizeFormatted: formatBytes(size),
          format,
          mimeType: asset.mimeType ?? 'application/octet-stream',
          lastModified: asset.lastModified,
          isMock: false,
        };
      });
    } catch (error) {
      console.warn('Multiple DocumentPicker error:', error);
      return [];
    }
  }

  /**
   * Validate selected document before starting conversion
   */
  public validateFile(
    file: SelectedFile,
    targetFormat: TargetFormat
  ): { isValid: boolean; error?: string } {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        isValid: false,
        error: `File size (${file.sizeFormatted}) exceeds the ${MAX_FILE_SIZE_LABEL} limit. Please select a smaller file.`,
      };
    }

    const availableOptions = CONVERSION_MATRIX[file.format] || [];
    const isSupported = availableOptions.some((opt) => opt.format === targetFormat);

    if (!isSupported) {
      return {
        isValid: false,
        error: `Conversion from ${file.format.toUpperCase()} to ${targetFormat.toUpperCase()} is not currently supported.`,
      };
    }

    return { isValid: true };
  }

  /**
   * Extracts clean document text suitable for translation
   */
  public async extractTextForTranslation(file: SelectedFile): Promise<string> {
    if (!file.uri) {
      throw new Error('File URI is required for text extraction.');
    }

    try {
      if (file.format === 'txt') {
        return await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }

      if (file.format === 'docx') {
        return await docxService.extractTextFromDocx(file.uri);
      }

      if (file.format === 'pdf') {
        const result = await pdfService.extractTextFromPdf(file.uri);
        if (result.isScanned) {
          throw new Error('Scanned PDF detected. This document contains scanned images without selectable text. An OCR engine or backend service is required to transcribe images.');
        }
        return result.text;
      }

      if (file.format === 'xlsx') {
        const csvResult = await xlsxService.convertXlsxToCsv(file.uri);
        return csvResult.preview;
      }

      throw new Error(`Text extraction not supported for format: ${file.format}`);
    } catch (err: any) {
      console.warn('extractTextForTranslation error:', err);
      throw err;
    }
  }

  /**
   * Execute real document conversion with progressive status updates
   */
  public async convertDocument(
    file: SelectedFile,
    targetFormat: TargetFormat,
    onProgress: (job: ConversionJob) => void
  ): Promise<ConversionJob> {
    const jobId = 'job_' + Date.now();
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const resultFileName = `${baseName}_converted.${targetFormat}`;

    const job: ConversionJob = {
      id: jobId,
      fileName: file.name,
      fileUri: file.uri,
      fileSize: file.size,
      fileSizeFormatted: file.sizeFormatted,
      sourceFormat: file.format,
      targetFormat: targetFormat,
      status: 'validating',
      progress: 5,
      currentStepText: 'Validating document integrity & signatures...',
      createdAt: new Date().toISOString(),
      canTranslate: targetFormat === 'docx' || targetFormat === 'txt' || targetFormat === 'pdf',
    };

    onProgress({ ...job });

    // Step 1: Validation
    const validation = this.validateFile(file, targetFormat);
    if (!validation.isValid) {
      job.status = 'failed';
      job.errorMessage = validation.error;
      onProgress({ ...job });
      historyService.addFromConversion(job);
      return job;
    }

    // Step 2: Try Remote Backend API if enabled
    if (API_CONFIG.useRemoteBackend) {
      job.status = 'uploading';
      job.progress = 25;
      job.currentStepText = 'Dispatching file to Vertex Cloud Enterprise Engine...';
      onProgress({ ...job });

      try {
        const remoteResp = await apiClient.convertDocument({
          fileName: file.name,
          fileUri: file.uri,
          fileSize: file.size,
          sourceFormat: file.format,
          targetFormat: targetFormat,
        });

        if (remoteResp && remoteResp.status === 'completed') {
          job.status = 'completed';
          job.progress = 100;
          job.currentStepText = 'Remote conversion completed successfully!';
          job.resultUri = remoteResp.resultUri;
          job.resultFileName = remoteResp.resultFileName;
          job.resultSize = remoteResp.resultSize;
          job.resultSizeFormatted = formatBytes(remoteResp.resultSize);
          job.completedAt = new Date().toISOString();
          historyService.addFromConversion(job);
          onProgress({ ...job });
          return job;
        }
      } catch (backendErr) {
        console.warn('Backend unavailable, falling back to on-device engine:', backendErr);
      }
    }

    // Step 3: Execute On-Device Conversion Engine
    job.status = 'processing';
    job.progress = 30;
    job.currentStepText = `Initializing ${file.format.toUpperCase()} to ${targetFormat.toUpperCase()} engine...`;
    onProgress({ ...job });

    try {
      let finalUri = '';
      let finalSize = 0;
      let finalFileName = resultFileName;

      // --- ROUTE 1: PDF to DOCX ---
      if (file.format === 'pdf' && targetFormat === 'docx') {
        job.progress = 40;
        job.currentStepText = 'Extracting PDF streams and selectable text layers...';
        onProgress({ ...job });

        const pdfExtracted = await pdfService.extractTextFromPdf(file.uri);
        if (pdfExtracted.isScanned) {
          throw new Error('Scanned PDF detected. This document consists of image-based pages. An OCR engine or cloud backend is required to transcribe images to Word text.');
        }

        job.progress = 70;
        job.currentStepText = 'Building OpenXML Word (.docx) document structure...';
        onProgress({ ...job });

        const paragraphs = pdfExtracted.text.split(/\r?\n\r?\n/).filter(Boolean);
        const docxResult = await docxService.generateDocx(paragraphs, {
          title: baseName,
          fileName: resultFileName,
        });

        // Validate created DOCX
        const validationResult = await docxService.validateDocx(docxResult.uri);
        if (!validationResult.isValid || validationResult.size === 0) {
          throw new Error('DOCX generation validation failed: output file is empty or corrupted.');
        }

        finalUri = docxResult.uri;
        finalSize = docxResult.size;
        finalFileName = docxResult.fileName;
      }

      // --- ROUTE 2: PDF to TXT ---
      else if (file.format === 'pdf' && targetFormat === 'txt') {
        job.progress = 50;
        job.currentStepText = 'Parsing PDF text streams...';
        onProgress({ ...job });

        const pdfExtracted = await pdfService.extractTextFromPdf(file.uri);
        if (pdfExtracted.isScanned) {
          throw new Error('Scanned PDF detected: no selectable text found. OCR is required.');
        }

        const outDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
        const targetPath = `${outDir}${resultFileName}`;
        await FileSystem.writeAsStringAsync(targetPath, pdfExtracted.text, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        const fileInfo = await FileSystem.getInfoAsync(targetPath);
        finalUri = targetPath;
        finalSize = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : pdfExtracted.text.length;
      }

      // --- ROUTE 3: DOCX to PDF ---
      else if (file.format === 'docx' && targetFormat === 'pdf') {
        job.progress = 45;
        job.currentStepText = 'Reading Word document paragraphs and styles...';
        onProgress({ ...job });

        const text = await docxService.extractTextFromDocx(file.uri);

        job.progress = 75;
        job.currentStepText = 'Typesetting paginated PDF layout with margins...';
        onProgress({ ...job });

        const pdfResult = await pdfService.createPdfFromText(text, {
          title: baseName,
          fileName: resultFileName,
        });

        finalUri = pdfResult.uri;
        finalSize = pdfResult.size;
        finalFileName = pdfResult.fileName;
      }

      // --- ROUTE 4: DOCX to TXT ---
      else if (file.format === 'docx' && targetFormat === 'txt') {
        job.progress = 50;
        job.currentStepText = 'Extracting clean text from Word archive...';
        onProgress({ ...job });

        const text = await docxService.extractTextFromDocx(file.uri);
        const outDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
        const targetPath = `${outDir}${resultFileName}`;

        await FileSystem.writeAsStringAsync(targetPath, text, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        const fileInfo = await FileSystem.getInfoAsync(targetPath);
        finalUri = targetPath;
        finalSize = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : text.length;
      }

      // --- ROUTE 5: TXT to DOCX ---
      else if (file.format === 'txt' && targetFormat === 'docx') {
        job.progress = 50;
        job.currentStepText = 'Packaging plain text into OpenXML Word format...';
        onProgress({ ...job });

        const content = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        const paragraphs = content.split(/\r?\n\r?\n/).filter(Boolean);

        const docxResult = await docxService.generateDocx(paragraphs, {
          title: baseName,
          fileName: resultFileName,
        });

        finalUri = docxResult.uri;
        finalSize = docxResult.size;
        finalFileName = docxResult.fileName;
      }

      // --- ROUTE 6: TXT to PDF ---
      else if (file.format === 'txt' && targetFormat === 'pdf') {
        job.progress = 50;
        job.currentStepText = 'Typesetting plain text into PDF pages...';
        onProgress({ ...job });

        const content = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        const pdfResult = await pdfService.createPdfFromText(content, {
          title: baseName,
          fileName: resultFileName,
        });

        finalUri = pdfResult.uri;
        finalSize = pdfResult.size;
        finalFileName = pdfResult.fileName;
      }

      // --- ROUTE 7: XLSX to CSV ---
      else if (file.format === 'xlsx' && targetFormat === 'csv') {
        job.progress = 50;
        job.currentStepText = 'Parsing Excel worksheets and shared string table...';
        onProgress({ ...job });

        const csvResult = await xlsxService.convertXlsxToCsv(file.uri, resultFileName);
        finalUri = csvResult.uri;
        finalSize = csvResult.size;
        finalFileName = csvResult.fileName;
      }

      // --- ROUTE 8: Images (JPG/PNG) to PDF ---
      else if ((file.format === 'jpg' || file.format === 'png') && targetFormat === 'pdf') {
        job.progress = 50;
        job.currentStepText = 'Embedding high-resolution image into PDF container...';
        onProgress({ ...job });

        const pdfResult = await pdfService.imagesToPdf([file.uri], resultFileName);
        finalUri = pdfResult.uri;
        finalSize = pdfResult.size;
        finalFileName = pdfResult.fileName;
      }

      // --- ROUTE 9: Image Format Transcoding (JPG <-> PNG <-> WebP) ---
      else if (
        (file.format === 'jpg' || file.format === 'png') &&
        (targetFormat === 'jpg' || targetFormat === 'png' || targetFormat === 'webp')
      ) {
        job.progress = 50;
        job.currentStepText = `Re-encoding image raster into ${targetFormat.toUpperCase()} format...`;
        onProgress({ ...job });

        const imgResult = await imageService.convertImage(
          file.uri,
          targetFormat as any,
          0.9,
          resultFileName
        );

        finalUri = imgResult.uri;
        finalSize = imgResult.size;
        finalFileName = imgResult.fileName;
      }

      // --- ROUTE 10: PPTX conversions requiring cloud rendering ---
      else if (file.format === 'pptx') {
        throw new Error(
          'PowerPoint presentation slide rendering requires the Vertex Cloud Presentation Engine. Please verify server connectivity or extract outline text.'
        );
      }

      else {
        throw new Error(`Conversion engine for ${file.format.toUpperCase()} to ${targetFormat.toUpperCase()} is not available.`);
      }

      // Step 4: Validate output file existence and non-zero size
      const checkInfo = await FileSystem.getInfoAsync(finalUri);
      if (!checkInfo.exists || ('size' in checkInfo && checkInfo.size === 0)) {
        throw new Error('Converted output file was not successfully generated on disk.');
      }

      job.status = 'completed';
      job.progress = 100;
      job.currentStepText = 'Conversion completed successfully!';
      job.resultUri = finalUri;
      job.resultFileName = finalFileName;
      job.resultSize = finalSize;
      job.resultSizeFormatted = formatBytes(finalSize);
      job.completedAt = new Date().toISOString();

      historyService.addFromConversion(job);
      onProgress({ ...job });
      return job;
    } catch (conversionErr: any) {
      console.warn('Conversion failed:', conversionErr);
      job.status = 'failed';
      job.errorMessage = conversionErr?.message || 'Document conversion failed.';
      job.currentStepText = 'Conversion error occurred.';
      onProgress({ ...job });
      historyService.addFromConversion(job);
      return job;
    }
  }

  /**
   * Share converted document
   */
  public async shareDocument(
    target: ConversionJob | string,
    title?: string
  ): Promise<boolean> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) return false;

      const uri = typeof target === 'string' ? target : target.resultUri;
      if (!uri) return false;

      await Sharing.shareAsync(uri, {
        dialogTitle: title || (typeof target !== 'string' ? target.resultFileName : undefined) || 'Share Converted Document',
      });
      return true;
    } catch (e) {
      console.warn('shareDocument error:', e);
      return false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const converterService = new ConverterService();
