/**
 * Vertex Docs Mobile - PDF to Image Service
 * Company: JM Vertex Technologies
 * 
 * Extracts and renders PDF pages into high-resolution PNG or JPG images
 * using hardware-accelerated Android native PdfRenderer with page selection,
 * custom resolutions, and ZIP bundle generation.
 */

import { NativeModules, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import JSZip from 'jszip';

const { PdfRendererModule } = NativeModules;

export type ImageOutputFormat = 'png' | 'jpg' | 'jpeg';
export type ImageResolutionScale = 1.0 | 2.0 | 3.0; // 1x (Standard), 2x (High), 3x (Very High)

export interface PdfInfo {
  pageCount: number;
  firstPageWidth: number;
  firstPageHeight: number;
  fileName: string;
  fileSize: number;
  fileUri: string;
}

export interface PageThumbnailItem {
  pageNumber: number;
  pageIndex: number; // 0-based
  uri: string;
  width: number;
  height: number;
}

export interface ExtractedImageItem {
  uri: string;
  fileName: string;
  pageNumber: number;
  pageIndex: number;
  width: number;
  height: number;
  size: number;
}

export interface PdfToImageResult {
  images: ExtractedImageItem[];
  totalConverted: number;
  totalSize: number;
  outputDirectory: string;
  pdfFileName: string;
  createdAt: string;
}

export interface ZipResult {
  uri: string;
  fileName: string;
  size: number;
}

export class PdfToImageService {
  /**
   * Reads PDF metadata and verifies page count
   */
  public async getPdfInfo(uri: string, name?: string): Promise<PdfInfo> {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    const fileSize = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;
    const fileName = name || uri.split('/').pop() || 'document.pdf';

    if (Platform.OS === 'android' && PdfRendererModule?.getPdfInfo) {
      try {
        const info = await PdfRendererModule.getPdfInfo(uri);
        return {
          pageCount: info.pageCount,
          firstPageWidth: info.firstPageWidth,
          firstPageHeight: info.firstPageHeight,
          fileName,
          fileSize,
          fileUri: uri,
        };
      } catch (err: any) {
        console.warn('Native getPdfInfo failed, checking file:', err);
        throw new Error(`Invalid or corrupted PDF file: ${err?.message || err}`);
      }
    }

    // Fallback if native module is unavailable (e.g. mock / test)
    return {
      pageCount: 1,
      firstPageWidth: 595,
      firstPageHeight: 842,
      fileName,
      fileSize,
      fileUri: uri,
    };
  }

  /**
   * Generates low-resolution thumbnail previews for each page in the PDF
   */
  public async getPageThumbnails(
    pdfUri: string,
    maxDimension: number = 220
  ): Promise<PageThumbnailItem[]> {
    if (Platform.OS === 'android' && PdfRendererModule?.getPageThumbnails) {
      try {
        const thumbs = await PdfRendererModule.getPageThumbnails(pdfUri, maxDimension);
        return thumbs as PageThumbnailItem[];
      } catch (err) {
        console.warn('getPageThumbnails error:', err);
        return [];
      }
    }
    return [];
  }

  /**
   * Renders selected PDF pages to high-resolution PNG or JPG images
   */
  public async renderPdfPages(
    pdfUri: string,
    pageIndices: number[], // 0-based
    options: {
      format: ImageOutputFormat;
      quality: number; // 10 to 100
      scale: ImageResolutionScale;
      baseName?: string;
    },
    onProgress?: (progress: number, stepText: string) => void
  ): Promise<PdfToImageResult> {
    if (!PdfRendererModule?.renderPagesToImages) {
      throw new Error(
        'PDF to Image rendering engine is only available on Android native builds.'
      );
    }

    onProgress?.(15, 'Preparing PDF pages for hardware rendering...');

    const baseName =
      options.baseName?.replace(/[^a-zA-Z0-9_-]/g, '_') ||
      `Doc_${Date.now()}`;

    const renderOptions = {
      format: options.format === 'jpeg' ? 'jpg' : options.format,
      quality: Math.max(10, Math.min(100, options.quality)),
      scale: options.scale,
      baseName,
    };

    onProgress?.(35, `Rendering ${pageIndices.length} pages to ${options.format.toUpperCase()}...`);

    const rawResult = await PdfRendererModule.renderPagesToImages(
      pdfUri,
      pageIndices,
      renderOptions
    );

    onProgress?.(90, 'Validating output image files...');

    const images: ExtractedImageItem[] = rawResult.images || [];

    // Verify output files exist and are non-empty
    for (const img of images) {
      const check = await FileSystem.getInfoAsync(img.uri);
      if (!check.exists || ('size' in check && check.size === 0)) {
        throw new Error(`Rendered page ${img.pageNumber} failed to write to disk.`);
      }
    }

    onProgress?.(100, 'PDF extraction completed successfully!');

    return {
      images,
      totalConverted: rawResult.totalConverted || images.length,
      totalSize: rawResult.totalSize || 0,
      outputDirectory: rawResult.outputDirectory || '',
      pdfFileName: `${baseName}.pdf`,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Bundles all extracted image files into a single ZIP archive using JSZip
   */
  public async createZipOfImages(
    images: ExtractedImageItem[],
    customZipName?: string
  ): Promise<ZipResult> {
    if (!images || images.length === 0) {
      throw new Error('No images available to create ZIP bundle.');
    }

    const zip = new JSZip();

    for (const item of images) {
      const base64 = await FileSystem.readAsStringAsync(item.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      zip.file(item.fileName, base64, { base64: true });
    }

    const zipBase64 = await zip.generateAsync({
      type: 'base64',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const outputDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
    const safeName = customZipName
      ? `${customZipName.replace(/[^a-zA-Z0-9_-]/g, '_')}.zip`
      : `Extracted_Pages_${Date.now()}.zip`;
    const targetPath = `${outputDir}${safeName}`;

    await FileSystem.writeAsStringAsync(targetPath, zipBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const info = await FileSystem.getInfoAsync(targetPath);
    const size = info.exists && 'size' in info ? info.size : zipBase64.length * 0.75;

    return {
      uri: targetPath,
      fileName: safeName,
      size,
    };
  }

  /**
   * Share single extracted image
   */
  public async shareImage(uri: string, fileName?: string): Promise<boolean> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) return false;

      const isPng = uri.toLowerCase().endsWith('.png');
      await Sharing.shareAsync(uri, {
        mimeType: isPng ? 'image/png' : 'image/jpeg',
        dialogTitle: fileName ? `Share ${fileName}` : 'Share Page Image',
      });
      return true;
    } catch (e) {
      console.warn('shareImage error:', e);
      return false;
    }
  }

  /**
   * Share ZIP archive of all extracted pages
   */
  public async shareZip(zipUri: string, fileName?: string): Promise<boolean> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) return false;

      await Sharing.shareAsync(zipUri, {
        mimeType: 'application/zip',
        dialogTitle: fileName ? `Share ${fileName}` : 'Share Images ZIP Bundle',
      });
      return true;
    } catch (e) {
      console.warn('shareZip error:', e);
      return false;
    }
  }
}

export const pdfToImageService = new PdfToImageService();
