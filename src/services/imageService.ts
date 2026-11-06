/**
 * Vertex Docs Mobile - Image Service
 * Company: JM Vertex Technologies
 * 
 * Image conversion (JPG, PNG, WebP) and iterative compression
 * targeting user-specified file sizes using expo-image-manipulator.
 */

import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

export type ImageTargetFormat = 'jpg' | 'jpeg' | 'png' | 'webp';

export interface ImageConversionResult {
  uri: string;
  size: number;
  width: number;
  height: number;
  fileName: string;
  format: ImageTargetFormat;
}

export interface ImageCompressionResult {
  uri: string;
  originalSize: number;
  finalSize: number;
  targetSize: number;
  achieved: boolean;
  originalDimensions: { width: number; height: number };
  finalDimensions: { width: number; height: number };
  compressionRatio: number; // percentage reduced, e.g. 65%
  fileName: string;
  iterations: number;
}

export class ImageService {
  /**
   * Converts an image to the requested format (JPG, PNG, WEBP)
   */
  public async convertImage(
    sourceUri: string,
    targetFormat: ImageTargetFormat,
    quality: number = 0.9,
    outputFileName?: string
  ): Promise<ImageConversionResult> {
    const saveFormat = this.resolveSaveFormat(targetFormat);

    const manipResult = await ImageManipulator.manipulateAsync(
      sourceUri,
      [], // No transformation actions, just re-encode
      {
        compress: Math.max(0.1, Math.min(1.0, quality)),
        format: saveFormat,
      }
    );

    const info = await FileSystem.getInfoAsync(manipResult.uri);
    const size = info.exists && 'size' in info ? info.size : 0;
    const ext = targetFormat === 'jpeg' ? 'jpg' : targetFormat;
    const safeFileName = outputFileName || `Image_${Date.now()}.${ext}`;

    return {
      uri: manipResult.uri,
      size,
      width: manipResult.width,
      height: manipResult.height,
      fileName: safeFileName,
      format: targetFormat,
    };
  }

  /**
   * Iteratively compresses an image to reach or approach target byte size
   * stepping down quality and resizing dimensions as needed.
   */
  public async compressToTargetSize(
    sourceUri: string,
    targetBytes: number,
    preferredFormat: ImageTargetFormat = 'jpg',
    onProgress?: (message: string, currentSize: number) => void
  ): Promise<ImageCompressionResult> {
    // 1. Get initial image info and dimensions
    const initialInfo = await FileSystem.getInfoAsync(sourceUri);
    const originalSize = initialInfo.exists && 'size' in initialInfo ? initialInfo.size : targetBytes * 2;

    const probe = await ImageManipulator.manipulateAsync(sourceUri, [], {
      compress: 1.0,
      format: this.resolveSaveFormat(preferredFormat),
    });

    let currentWidth = probe.width;
    let currentHeight = probe.height;
    const originalDimensions = { width: currentWidth, height: currentHeight };

    // If source file is already smaller than target, return high quality copy
    if (originalSize <= targetBytes) {
      return {
        uri: probe.uri,
        originalSize,
        finalSize: originalSize,
        targetSize: targetBytes,
        achieved: true,
        originalDimensions,
        finalDimensions: { width: currentWidth, height: currentHeight },
        compressionRatio: 0,
        fileName: `Compressed_${Date.now()}.${preferredFormat}`,
        iterations: 1,
      };
    }

    // Iterative quality and dimension stepping
    const qualitySteps = [0.85, 0.7, 0.55, 0.4, 0.25, 0.15];
    let bestResultUri = probe.uri;
    let bestSize = originalSize;
    let iterations = 0;
    const saveFormat = this.resolveSaveFormat(preferredFormat);

    for (const q of qualitySteps) {
      iterations++;
      onProgress?.(`Applying quality level ${Math.round(q * 100)}%...`, bestSize);

      const result = await ImageManipulator.manipulateAsync(
        sourceUri,
        currentWidth < originalDimensions.width
          ? [{ resize: { width: Math.round(currentWidth), height: Math.round(currentHeight) } }]
          : [],
        {
          compress: q,
          format: saveFormat,
        }
      );

      const info = await FileSystem.getInfoAsync(result.uri);
      const size = info.exists && 'size' in info ? info.size : bestSize;

      bestResultUri = result.uri;
      bestSize = size;
      currentWidth = result.width;
      currentHeight = result.height;

      if (bestSize <= targetBytes) {
        break;
      }
    }

    // If still over target size, downscale dimensions
    if (bestSize > targetBytes) {
      const dimensionScales = [0.8, 0.65, 0.5, 0.35];

      for (const scale of dimensionScales) {
        iterations++;
        const targetWidth = Math.max(120, Math.round(originalDimensions.width * scale));
        const targetHeight = Math.max(120, Math.round(originalDimensions.height * scale));

        onProgress?.(
          `Downscaling dimensions to ${targetWidth}x${targetHeight}...`,
          bestSize
        );

        const result = await ImageManipulator.manipulateAsync(
          sourceUri,
          [{ resize: { width: targetWidth, height: targetHeight } }],
          {
            compress: 0.35,
            format: saveFormat,
          }
        );

        const info = await FileSystem.getInfoAsync(result.uri);
        const size = info.exists && 'size' in info ? info.size : bestSize;

        bestResultUri = result.uri;
        bestSize = size;
        currentWidth = result.width;
        currentHeight = result.height;

        if (bestSize <= targetBytes) {
          break;
        }
      }
    }

    const reduction = Math.max(0, originalSize - bestSize);
    const compressionRatio = Math.round((reduction / originalSize) * 100);

    return {
      uri: bestResultUri,
      originalSize,
      finalSize: bestSize,
      targetSize: targetBytes,
      achieved: bestSize <= targetBytes,
      originalDimensions,
      finalDimensions: { width: currentWidth, height: currentHeight },
      compressionRatio,
      fileName: `Compressed_${Date.now()}.${preferredFormat}`,
      iterations,
    };
  }

  private resolveSaveFormat(format: ImageTargetFormat): ImageManipulator.SaveFormat {
    switch (format.toLowerCase()) {
      case 'png':
        return ImageManipulator.SaveFormat.PNG;
      case 'webp':
        return ImageManipulator.SaveFormat.WEBP;
      case 'jpg':
      case 'jpeg':
      default:
        return ImageManipulator.SaveFormat.JPEG;
    }
  }
}

export const imageService = new ImageService();
