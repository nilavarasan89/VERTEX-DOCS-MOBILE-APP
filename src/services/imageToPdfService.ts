/**
 * Vertex Docs Mobile - Image to PDF Service
 * Company: JM Vertex Technologies
 * 
 * Converts one or multiple images into a high-fidelity, customized PDF document
 * with page size, orientation, margins, placement, and compression settings.
 */

import { PDFDocument, rgb } from 'pdf-lib';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export type PdfPageSize = 'a4' | 'letter' | 'legal' | 'original';
export type PdfOrientation = 'portrait' | 'landscape';
export type ImagePlacement = 'fit' | 'fill' | 'original';
export type PdfMargin = 'none' | 'small' | 'medium' | 'large';
export type ImageQuality = 'high' | 'medium' | 'compact';

export interface ImageToPdfOptions {
  pageSize: PdfPageSize;
  orientation: PdfOrientation;
  placement: ImagePlacement;
  margin: PdfMargin;
  quality: ImageQuality;
  customFileName?: string;
}

export interface SelectedImageItem {
  id: string;
  uri: string;
  name: string;
  size?: number;
  width?: number;
  height?: number;
  format?: string;
}

export interface ImageToPdfResult {
  uri: string;
  fileName: string;
  size: number;
  pageCount: number;
  createdAt: string;
}

export class ImageToPdfService {
  /**
   * Converts an ordered array of images to a valid PDF document.
   */
  public async convertImagesToPdf(
    images: SelectedImageItem[],
    options: ImageToPdfOptions,
    onProgress?: (progress: number, stepText: string) => void
  ): Promise<ImageToPdfResult> {
    if (!images || images.length === 0) {
      throw new Error('Please select at least one image to convert to PDF.');
    }

    onProgress?.(10, 'Initializing PDF document container...');
    const doc = await PDFDocument.create();

    const totalImages = images.length;

    for (let i = 0; i < totalImages; i++) {
      const item = images[i];
      const progressPercent = Math.round(15 + ((i + 1) / totalImages) * 70);
      onProgress?.(
        progressPercent,
        `Processing image ${i + 1} of ${totalImages}: ${item.name}...`
      );

      // Preprocess image (downscale/compress if needed to avoid OOM on large camera images)
      const processed = await this.preprocessImage(item.uri, options.quality);

      const base64 = await FileSystem.readAsStringAsync(processed.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const isPng =
        item.name.toLowerCase().endsWith('.png') ||
        processed.uri.toLowerCase().endsWith('.png');

      const embeddedImage = isPng
        ? await doc.embedPng(base64)
        : await doc.embedJpg(base64);

      const imgWidth = embeddedImage.width;
      const imgHeight = embeddedImage.height;

      // 1. Calculate Page Dimensions
      let pageWidth = 595.28; // default A4
      let pageHeight = 841.89;

      if (options.pageSize === 'letter') {
        pageWidth = 612.0;
        pageHeight = 792.0;
      } else if (options.pageSize === 'legal') {
        pageWidth = 612.0;
        pageHeight = 1008.0;
      } else if (options.pageSize === 'original') {
        pageWidth = imgWidth;
        pageHeight = imgHeight;
      }

      // Handle orientation (unless original dimensions are used)
      if (options.pageSize !== 'original') {
        const minDim = Math.min(pageWidth, pageHeight);
        const maxDim = Math.max(pageWidth, pageHeight);

        if (options.orientation === 'landscape') {
          pageWidth = maxDim;
          pageHeight = minDim;
        } else {
          pageWidth = minDim;
          pageHeight = maxDim;
        }
      }

      // 2. Calculate Margins
      let marginPt = 0;
      if (options.pageSize !== 'original') {
        switch (options.margin) {
          case 'small':
            marginPt = 15;
            break;
          case 'medium':
            marginPt = 36;
            break;
          case 'large':
            marginPt = 54;
            break;
          case 'none':
          default:
            marginPt = 0;
            break;
        }
      }

      const usableWidth = Math.max(10, pageWidth - 2 * marginPt);
      const usableHeight = Math.max(10, pageHeight - 2 * marginPt);

      // 3. Calculate Placement & Scaling
      let drawWidth = usableWidth;
      let drawHeight = usableHeight;
      let drawX = marginPt;
      let drawY = marginPt;

      if (options.placement === 'fit') {
        const scale = Math.min(usableWidth / imgWidth, usableHeight / imgHeight);
        drawWidth = imgWidth * scale;
        drawHeight = imgHeight * scale;
        drawX = marginPt + (usableWidth - drawWidth) / 2;
        drawY = marginPt + (usableHeight - drawHeight) / 2;
      } else if (options.placement === 'fill') {
        const scale = Math.max(usableWidth / imgWidth, usableHeight / imgHeight);
        drawWidth = imgWidth * scale;
        drawHeight = imgHeight * scale;
        drawX = marginPt + (usableWidth - drawWidth) / 2;
        drawY = marginPt + (usableHeight - drawHeight) / 2;
      } else if (options.placement === 'original') {
        const scale = Math.min(1.0, Math.min(usableWidth / imgWidth, usableHeight / imgHeight));
        drawWidth = imgWidth * scale;
        drawHeight = imgHeight * scale;
        drawX = marginPt + (usableWidth - drawWidth) / 2;
        drawY = marginPt + (usableHeight - drawHeight) / 2;
      }

      // 4. Add Page and Draw White Background + Image
      const page = doc.addPage([pageWidth, pageHeight]);

      // Fill background with clean white
      page.drawRectangle({
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
        color: rgb(1, 1, 1),
      });

      // Draw the image
      page.drawImage(embeddedImage, {
        x: drawX,
        y: drawY,
        width: drawWidth,
        height: drawHeight,
      });
    }

    onProgress?.(90, 'Packaging and writing final PDF file...');

    const base64Data = await doc.saveAsBase64();
    const outputDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
    const safeBaseName =
      options.customFileName?.trim().replace(/[^a-zA-Z0-9_-]/g, '_') ||
      `Images_Document_${Date.now()}`;
    const safeFileName = safeBaseName.endsWith('.pdf') ? safeBaseName : `${safeBaseName}.pdf`;
    const targetPath = `${outputDir}${safeFileName}`;

    await FileSystem.writeAsStringAsync(targetPath, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const info = await FileSystem.getInfoAsync(targetPath);
    const size = info.exists && 'size' in info ? info.size : base64Data.length * 0.75;

    if (!info.exists || size === 0) {
      throw new Error('Image to PDF conversion failed: output file is empty.');
    }

    onProgress?.(100, 'Image to PDF conversion complete!');

    return {
      uri: targetPath,
      fileName: safeFileName,
      size,
      pageCount: totalImages,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Preprocess image to guarantee safe memory footprint on mobile devices
   */
  private async preprocessImage(
    uri: string,
    quality: ImageQuality
  ): Promise<{ uri: string }> {
    const isPng = uri.toLowerCase().endsWith('.png');

    let compressLevel = 0.9;
    if (quality === 'medium') compressLevel = 0.75;
    if (quality === 'compact') compressLevel = 0.55;

    try {
      // Scale down any ultra-high-res camera captures (> 2400px) to prevent Out-Of-Memory
      const manip = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 2400 } }],
        {
          compress: compressLevel,
          format: isPng
            ? ImageManipulator.SaveFormat.PNG
            : ImageManipulator.SaveFormat.JPEG,
        }
      );
      return { uri: manip.uri };
    } catch {
      // If manipulation fails for any reason, use raw URI
      return { uri };
    }
  }

  /**
   * Share generated PDF using system share sheet
   */
  public async sharePdf(uri: string, fileName?: string): Promise<boolean> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) return false;

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: fileName ? `Share ${fileName}` : 'Share Generated PDF',
      });
      return true;
    } catch (e) {
      console.warn('sharePdf error:', e);
      return false;
    }
  }
}

export const imageToPdfService = new ImageToPdfService();
