/**
 * Vertex Docs Mobile - PDF Service
 * Company: JM Vertex Technologies
 * 
 * High-fidelity PDF creation, text stream parsing, merging,
 * image-to-PDF conversion, and page manipulation using pdf-lib.
 */

import {
  PDFDocument,
  StandardFonts,
  rgb,
  degrees,
  PDFArray,
  decodePDFRawStream,
  PDFRawStream,
} from 'pdf-lib';
import * as FileSystem from 'expo-file-system/legacy';

export interface PdfExtractionResult {
  text: string;
  isScanned: boolean;
  pageCount: number;
  pages: { pageNumber: number; text: string }[];
}

export interface PdfOperationResult {
  uri: string;
  size: number;
  pageCount: number;
  fileName: string;
}

export class PdfService {
  /**
   * Parse text streams from a PDF file.
   * If no text streams or readable characters are present, accurately identifies as scanned/image-based.
   */
  public async extractTextFromPdf(uri: string): Promise<PdfExtractionResult> {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const doc = await PDFDocument.load(base64, { ignoreEncryption: true });
      const pages = doc.getPages();
      const pageCount = pages.length;
      const pageResults: { pageNumber: number; text: string }[] = [];

      for (let i = 0; i < pageCount; i++) {
        const page = pages[i];
        const pageNumber = i + 1;
        let pageText = '';

        try {
          const contents = page.node.Contents();
          if (contents) {
            const refs = contents instanceof PDFArray ? contents.asArray() : [contents];
            for (const ref of refs) {
              const streamObj = doc.context.lookup(ref);
              if (streamObj && streamObj instanceof PDFRawStream) {
                try {
                  const decoded = decodePDFRawStream(streamObj);
                  const streamBytes = decoded.decode();
                  const extracted = this.parsePdfContentStream(streamBytes);
                  if (extracted) {
                    pageText += (pageText ? '\n' : '') + extracted;
                  }
                } catch (decodeErr) {
                  // Fallback for uncompressed or direct stream inspection
                  console.warn(`Stream decode notice on page ${pageNumber}:`, decodeErr);
                }
              }
            }
          }
        } catch (pageErr) {
          console.warn(`Could not read page ${pageNumber} content:`, pageErr);
        }

        pageResults.push({
          pageNumber,
          text: pageText.trim(),
        });
      }

      const fullText = pageResults
        .map((p) => p.text)
        .filter((t) => t.length > 0)
        .join('\n\n');

      // If less than 20 non-space characters in whole PDF, it's image-only / scanned
      const isScanned = fullText.replace(/\s+/g, '').length < 20;

      return {
        text: fullText,
        isScanned,
        pageCount,
        pages: pageResults,
      };
    } catch (err: any) {
      console.warn('extractTextFromPdf error:', err);
      throw new Error(`Failed to extract text from PDF: ${err?.message || err}`);
    }
  }

  /**
   * Helper to parse text operators inside BT ... ET blocks
   */
  private parsePdfContentStream(bytes: Uint8Array): string {
    let streamText = '';
    // Convert Uint8Array to string safely without exceeding call stack
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const slice = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      streamText += String.fromCharCode.apply(null, slice as any);
    }

    const textChunks: string[] = [];
    const btRegex = /BT[\s\S]*?ET/g;
    let blockMatch;

    while ((blockMatch = btRegex.exec(streamText)) !== null) {
      const block = blockMatch[0];

      // 1. Tj operators: (text) Tj or <hex> Tj
      const tjRegex = /(?:\((.*?)\)|<([0-9a-fA-F]+)>)\s*Tj/g;
      let match;
      while ((match = tjRegex.exec(block)) !== null) {
        if (match[1] !== undefined) {
          const unescaped = match[1]
            .replace(/\\([()\\])/g, '$1')
            .replace(/\\r/g, '')
            .replace(/\\n/g, '\n');
          if (unescaped.trim()) textChunks.push(unescaped);
        } else if (match[2] !== undefined) {
          const hex = match[2];
          let str = '';
          for (let k = 0; k < hex.length; k += 2) {
            str += String.fromCharCode(parseInt(hex.substr(k, 2), 16));
          }
          if (str.trim()) textChunks.push(str);
        }
      }

      // 2. TJ operators (arrays of strings and spacing)
      const tjArrayRegex = /\[([\s\S]*?)\]\s*TJ/g;
      while ((match = tjArrayRegex.exec(block)) !== null) {
        const inner = match[1];
        const partRegex = /(?:\((.*?)\)|<([0-9a-fA-F]+)>)/g;
        let part;
        let line = '';
        while ((part = partRegex.exec(inner)) !== null) {
          if (part[1] !== undefined) {
            line += part[1].replace(/\\([()\\])/g, '$1');
          } else if (part[2] !== undefined) {
            const hex = part[2];
            for (let k = 0; k < hex.length; k += 2) {
              line += String.fromCharCode(parseInt(hex.substr(k, 2), 16));
            }
          }
        }
        if (line.trim()) textChunks.push(line);
      }
    }

    return textChunks.join('\n');
  }

  /**
   * Generates a multi-page PDF document from text with proper margins, wrapping, and typography.
   */
  public async createPdfFromText(
    text: string,
    options?: { title?: string; fileName?: string }
  ): Promise<PdfOperationResult> {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 595.28; // A4
    const pageHeight = 841.89;
    const margin = 50;
    const contentWidth = pageWidth - margin * 2;
    const fontSize = 11;
    const lineHeight = 16;
    const titleFontSize = 18;
    const titleLineHeight = 24;

    // Break text into wrapped lines
    const paragraphs = text.split(/\r?\n/);
    const lines: { text: string; isTitle?: boolean; isHeading?: boolean }[] = [];

    if (options?.title) {
      lines.push({ text: options.title, isTitle: true });
      lines.push({ text: '' }); // Spacing
    }

    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim();
      if (!trimmed) {
        lines.push({ text: '' });
        continue;
      }

      const isHeading =
        trimmed.startsWith('# ') ||
        (trimmed === trimmed.toUpperCase() && trimmed.length < 50 && !trimmed.includes('.'));

      const cleanText = trimmed.startsWith('# ') ? trimmed.substring(2) : trimmed;

      if (isHeading) {
        lines.push({ text: cleanText, isHeading: true });
        continue;
      }

      // Word wrapping
      const words = cleanText.split(/\s+/);
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textWidth = font.widthOfTextAtSize(testLine, fontSize);

        if (textWidth <= contentWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push({ text: currentLine });
          }
          currentLine = word;
        }
      }

      if (currentLine) {
        lines.push({ text: currentLine });
      }
    }

    // Paginate lines onto PDF pages
    let currentPage = doc.addPage([pageWidth, pageHeight]);
    let currentY = pageHeight - margin;

    for (let idx = 0; idx < lines.length; idx++) {
      const lineItem = lines[idx];
      const requiredHeight = lineItem.isTitle
        ? titleLineHeight
        : lineItem.isHeading
        ? lineHeight * 1.5
        : lineHeight;

      if (currentY - requiredHeight < margin) {
        // Page break
        currentPage = doc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - margin;
      }

      if (lineItem.text === '') {
        currentY -= lineHeight * 0.5;
        continue;
      }

      if (lineItem.isTitle) {
        currentPage.drawText(lineItem.text, {
          x: margin,
          y: currentY,
          size: titleFontSize,
          font: fontBold,
          color: rgb(0.12, 0.25, 0.69),
        });
        currentY -= titleLineHeight;
      } else if (lineItem.isHeading) {
        currentPage.drawText(lineItem.text, {
          x: margin,
          y: currentY,
          size: fontSize + 2,
          font: fontBold,
          color: rgb(0.15, 0.39, 0.92),
        });
        currentY -= lineHeight * 1.3;
      } else {
        currentPage.drawText(lineItem.text, {
          x: margin,
          y: currentY,
          size: fontSize,
          font: font,
          color: rgb(0.12, 0.16, 0.22),
        });
        currentY -= lineHeight;
      }
    }

    // Add page numbers
    const totalPages = doc.getPageCount();
    for (let pIdx = 0; pIdx < totalPages; pIdx++) {
      const p = doc.getPages()[pIdx];
      const pageStr = `Page ${pIdx + 1} of ${totalPages} - Generated by Vertex Docs`;
      const strWidth = font.widthOfTextAtSize(pageStr, 8);
      p.drawText(pageStr, {
        x: (pageWidth - strWidth) / 2,
        y: 25,
        size: 8,
        font: font,
        color: rgb(0.55, 0.58, 0.63),
      });
    }

    const base64Data = await doc.saveAsBase64();
    const outputDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
    const safeFileName = options?.fileName || `VertexDoc_${Date.now()}.pdf`;
    const targetPath = `${outputDir}${safeFileName}`;

    await FileSystem.writeAsStringAsync(targetPath, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const fileInfo = await FileSystem.getInfoAsync(targetPath);
    const size = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : base64Data.length * 0.75;

    return {
      uri: targetPath,
      size,
      pageCount: totalPages,
      fileName: safeFileName,
    };
  }

  /**
   * Merges multiple PDF files in ordered sequence into a single PDF document.
   */
  public async mergePdfs(
    uris: string[],
    outputFileName?: string
  ): Promise<PdfOperationResult> {
    if (!uris || uris.length === 0) {
      throw new Error('At least one PDF file must be provided to merge.');
    }

    const mergedDoc = await PDFDocument.create();

    for (let i = 0; i < uris.length; i++) {
      const uri = uris[i];
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const sourceDoc = await PDFDocument.load(base64, { ignoreEncryption: true });
      const copiedPages = await mergedDoc.copyPages(sourceDoc, sourceDoc.getPageIndices());
      copiedPages.forEach((page) => mergedDoc.addPage(page));
    }

    const totalPages = mergedDoc.getPageCount();
    const base64Data = await mergedDoc.saveAsBase64();

    const outputDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
    const safeFileName = outputFileName || `Merged_Document_${Date.now()}.pdf`;
    const targetPath = `${outputDir}${safeFileName}`;

    await FileSystem.writeAsStringAsync(targetPath, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const fileInfo = await FileSystem.getInfoAsync(targetPath);
    const size = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : base64Data.length * 0.75;

    return {
      uri: targetPath,
      size,
      pageCount: totalPages,
      fileName: safeFileName,
    };
  }

  /**
   * Combines multiple images (JPG/PNG) into a single multi-page PDF.
   */
  public async imagesToPdf(
    imageUris: string[],
    outputFileName?: string
  ): Promise<PdfOperationResult> {
    if (!imageUris || imageUris.length === 0) {
      throw new Error('At least one image must be provided.');
    }

    const doc = await PDFDocument.create();

    for (const uri of imageUris) {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const isPng = uri.toLowerCase().endsWith('.png');
      const image = isPng ? await doc.embedPng(base64) : await doc.embedJpg(base64);

      const { width, height } = image.scale(1.0);
      const page = doc.addPage([width, height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width,
        height,
      });
    }

    const totalPages = doc.getPageCount();
    const base64Data = await doc.saveAsBase64();

    const outputDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
    const safeFileName = outputFileName || `Images_Combined_${Date.now()}.pdf`;
    const targetPath = `${outputDir}${safeFileName}`;

    await FileSystem.writeAsStringAsync(targetPath, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const fileInfo = await FileSystem.getInfoAsync(targetPath);
    const size = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : base64Data.length * 0.75;

    return {
      uri: targetPath,
      size,
      pageCount: totalPages,
      fileName: safeFileName,
    };
  }

  /**
   * Performs page modifications: delete pages or rotate pages.
   */
  public async modifyPdfPages(
    uri: string,
    actions: {
      deletePages?: number[]; // 0-based page indices
      rotatePages?: { pageIndex: number; degrees: 90 | 180 | 270 }[];
    },
    outputFileName?: string
  ): Promise<PdfOperationResult> {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const doc = await PDFDocument.load(base64, { ignoreEncryption: true });

    // Handle rotations
    if (actions.rotatePages) {
      const allPages = doc.getPages();
      for (const item of actions.rotatePages) {
        if (item.pageIndex >= 0 && item.pageIndex < allPages.length) {
          const page = allPages[item.pageIndex];
          const currentRotation = page.getRotation().angle;
          page.setRotation(degrees((currentRotation + item.degrees) % 360));
        }
      }
    }

    // Handle deletions (must delete in descending order)
    if (actions.deletePages && actions.deletePages.length > 0) {
      const sortedIndices = [...actions.deletePages].sort((a, b) => b - a);
      for (const pIdx of sortedIndices) {
        if (pIdx >= 0 && pIdx < doc.getPageCount()) {
          doc.removePage(pIdx);
        }
      }
    }

    if (doc.getPageCount() === 0) {
      throw new Error('Cannot delete all pages from PDF. At least one page must remain.');
    }

    const totalPages = doc.getPageCount();
    const base64Data = await doc.saveAsBase64();

    const outputDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
    const safeFileName = outputFileName || `Modified_${Date.now()}.pdf`;
    const targetPath = `${outputDir}${safeFileName}`;

    await FileSystem.writeAsStringAsync(targetPath, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const fileInfo = await FileSystem.getInfoAsync(targetPath);
    const size = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : base64Data.length * 0.75;

    return {
      uri: targetPath,
      size,
      pageCount: totalPages,
      fileName: safeFileName,
    };
  }

  /**
   * Retrieves page count of a PDF file
   */
  public async getPdfPageCount(uri: string): Promise<number> {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const doc = await PDFDocument.load(base64, { ignoreEncryption: true });
    return doc.getPageCount();
  }
}

export const pdfService = new PdfService();
