/**
 * Vertex Docs Mobile - Format Conversion Matrix & Capabilities
 * Company: JM Vertex Technologies
 */

import { SourceFormat, TargetFormat, ConversionOption } from '../types/converter';

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
export const MAX_FILE_SIZE_LABEL = '50 MB';

export interface FormatMeta {
  format: SourceFormat;
  label: string;
  extension: string;
  mimeType: string;
  iconName: string;
  color: string;
  bgLight: string;
  description: string;
}

export const FORMAT_METADATA: Record<SourceFormat, FormatMeta> = {
  pdf: {
    format: 'pdf',
    label: 'Adobe PDF',
    extension: '.pdf',
    mimeType: 'application/pdf',
    iconName: 'document-text',
    color: '#DC2626',
    bgLight: '#FEF2F2',
    description: 'Portable Document Format',
  },
  docx: {
    format: 'docx',
    label: 'Microsoft Word',
    extension: '.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    iconName: 'document',
    color: '#2563EB',
    bgLight: '#EFF6FF',
    description: 'Word OpenXML Document',
  },
  pptx: {
    format: 'pptx',
    label: 'PowerPoint Slide',
    extension: '.pptx',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    iconName: 'easel',
    color: '#D97706',
    bgLight: '#FFFBEB',
    description: 'Presentation Slide Deck',
  },
  xlsx: {
    format: 'xlsx',
    label: 'Excel Spreadsheet',
    extension: '.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    iconName: 'grid',
    color: '#059669',
    bgLight: '#ECFDF5',
    description: 'Microsoft Excel Workbook',
  },
  txt: {
    format: 'txt',
    label: 'Plain Text',
    extension: '.txt',
    mimeType: 'text/plain',
    iconName: 'newspaper',
    color: '#4B5563',
    bgLight: '#F3F4F6',
    description: 'Raw UTF-8 Text',
  },
  jpg: {
    format: 'jpg',
    label: 'JPEG Image',
    extension: '.jpg',
    mimeType: 'image/jpeg',
    iconName: 'image',
    color: '#059669',
    bgLight: '#ECFDF5',
    description: 'High Quality Picture',
  },
  png: {
    format: 'png',
    label: 'PNG Image',
    extension: '.png',
    mimeType: 'image/png',
    iconName: 'images',
    color: '#0D9488',
    bgLight: '#F0FDFA',
    description: 'Lossless Raster Image',
  },
};

/**
 * Verified capability table explaining genuine engines and limitations
 */
export interface ConversionCapability {
  source: SourceFormat;
  target: TargetFormat;
  engine: string;
  executionMode: 'on-device' | 'backend-required';
  limitations: string;
}

export const CONVERSION_CAPABILITY_TABLE: ConversionCapability[] = [
  {
    source: 'pdf',
    target: 'docx',
    engine: 'pdfService (Stream Extractor) + JSZip OpenXML Builder',
    executionMode: 'on-device',
    limitations: 'Extracts selectable text and styles. Scanned image-only PDFs require OCR.',
  },
  {
    source: 'pdf',
    target: 'txt',
    engine: 'pdfService Content Stream Parser',
    executionMode: 'on-device',
    limitations: 'Extracts clean text streams. Scanned image-only PDFs require OCR.',
  },
  {
    source: 'docx',
    target: 'pdf',
    engine: 'docxService (XML Parser) + pdf-lib Typesetter',
    executionMode: 'on-device',
    limitations: 'Renders headings, paragraphs, and margins onto paginated A4 layout.',
  },
  {
    source: 'docx',
    target: 'txt',
    engine: 'docxService OpenXML Paragraph Extractor',
    executionMode: 'on-device',
    limitations: 'Extracts paragraph and heading text cleanly.',
  },
  {
    source: 'txt',
    target: 'docx',
    engine: 'JSZip OpenXML Word Document Generator',
    executionMode: 'on-device',
    limitations: 'Creates structured OpenXML Word (.docx) archive with styles.',
  },
  {
    source: 'txt',
    target: 'pdf',
    engine: 'pdf-lib Multipage Typesetter',
    executionMode: 'on-device',
    limitations: 'Formats text into multi-page PDF with margins and page numbers.',
  },
  {
    source: 'xlsx',
    target: 'csv',
    engine: 'xlsxService (Shared Strings & Sheet Data Parser)',
    executionMode: 'on-device',
    limitations: 'Converts first worksheet rows and cells to standard CSV format.',
  },
  {
    source: 'jpg',
    target: 'png',
    engine: 'expo-image-manipulator Lossless Re-encoder',
    executionMode: 'on-device',
    limitations: 'Re-encodes JPG pixels into lossless PNG format.',
  },
  {
    source: 'jpg',
    target: 'webp',
    engine: 'expo-image-manipulator Modern WebP Encoder',
    executionMode: 'on-device',
    limitations: 'Compresses picture into WebP container with high efficiency.',
  },
  {
    source: 'jpg',
    target: 'pdf',
    engine: 'pdf-lib Image Page Embedder',
    executionMode: 'on-device',
    limitations: 'Embeds full resolution photo into PDF document page.',
  },
  {
    source: 'png',
    target: 'jpg',
    engine: 'expo-image-manipulator Alpha-Flattener & JPEG Encoder',
    executionMode: 'on-device',
    limitations: 'Flattens transparent alpha channel to white background.',
  },
  {
    source: 'png',
    target: 'webp',
    engine: 'expo-image-manipulator Modern WebP Encoder',
    executionMode: 'on-device',
    limitations: 'Encodes PNG image into lightweight WebP format.',
  },
  {
    source: 'png',
    target: 'pdf',
    engine: 'pdf-lib Lossless PNG Embedder',
    executionMode: 'on-device',
    limitations: 'Embeds lossless image onto PDF page.',
  },
  {
    source: 'pptx',
    target: 'pdf',
    engine: 'Vertex Cloud Enterprise Presentation Renderer',
    executionMode: 'backend-required',
    limitations: 'High-fidelity vector shape rendering requires active backend connection.',
  },
];

/**
 * Valid conversion options per source format
 */
export const CONVERSION_MATRIX: Record<SourceFormat, ConversionOption[]> = {
  pdf: [
    {
      format: 'docx',
      label: 'Word Document',
      extension: '.docx',
      icon: 'document',
      badge: 'Popular',
      description: 'Genuine OpenXML Word file preserving text & paragraphs',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      estimatedTimeSec: 3,
    },
    {
      format: 'txt',
      label: 'Editable Text',
      extension: '.txt',
      icon: 'newspaper',
      badge: 'Fast',
      description: 'Extracts clean selectable text for quick translation',
      mimeType: 'text/plain',
      estimatedTimeSec: 2,
    },
    {
      format: 'pptx',
      label: 'PowerPoint Deck',
      extension: '.pptx',
      icon: 'easel',
      badge: 'Cloud',
      description: 'Converts PDF pages into slides via Cloud Backend',
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      estimatedTimeSec: 5,
    },
  ],
  docx: [
    {
      format: 'pdf',
      label: 'Adobe PDF',
      extension: '.pdf',
      icon: 'document-text',
      badge: 'Standard',
      description: 'Generates paginated PDF with margins & headers',
      mimeType: 'application/pdf',
      estimatedTimeSec: 3,
    },
    {
      format: 'txt',
      label: 'Plain Text',
      extension: '.txt',
      icon: 'newspaper',
      badge: 'Fast',
      description: 'Extracts all paragraph text into raw UTF-8',
      mimeType: 'text/plain',
      estimatedTimeSec: 1,
    },
  ],
  xlsx: [
    {
      format: 'csv',
      label: 'CSV Spreadsheet',
      extension: '.csv',
      icon: 'grid',
      badge: 'Instant',
      description: 'Converts worksheet rows and columns to standard CSV',
      mimeType: 'text/csv',
      estimatedTimeSec: 2,
    },
  ],
  pptx: [
    {
      format: 'pdf',
      label: 'Adobe PDF',
      extension: '.pdf',
      icon: 'document-text',
      badge: 'Cloud',
      description: 'Requires Vertex Cloud Presentation Renderer',
      mimeType: 'application/pdf',
      estimatedTimeSec: 4,
    },
    {
      format: 'docx',
      label: 'Word Document',
      extension: '.docx',
      icon: 'document',
      badge: 'Outline',
      description: 'Extracts slide speaker notes and text into Word',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      estimatedTimeSec: 3,
    },
  ],
  jpg: [
    {
      format: 'pdf',
      label: 'Adobe PDF',
      extension: '.pdf',
      icon: 'document-text',
      badge: 'Doc Page',
      description: 'Embeds photo into high-resolution PDF page',
      mimeType: 'application/pdf',
      estimatedTimeSec: 2,
    },
    {
      format: 'png',
      label: 'PNG Image',
      extension: '.png',
      icon: 'images',
      badge: 'Lossless',
      description: 'Re-encodes JPEG into lossless PNG raster',
      mimeType: 'image/png',
      estimatedTimeSec: 2,
    },
    {
      format: 'webp',
      label: 'WebP Image',
      extension: '.webp',
      icon: 'globe',
      badge: 'Modern',
      description: 'Compresses picture into lightweight WebP format',
      mimeType: 'image/webp',
      estimatedTimeSec: 2,
    },
  ],
  png: [
    {
      format: 'pdf',
      label: 'Adobe PDF',
      extension: '.pdf',
      icon: 'document-text',
      badge: 'Doc Page',
      description: 'Embeds crisp PNG image into PDF document',
      mimeType: 'application/pdf',
      estimatedTimeSec: 2,
    },
    {
      format: 'jpg',
      label: 'JPEG Image',
      extension: '.jpg',
      icon: 'image',
      badge: 'Compact',
      description: 'Flattens transparency and creates compressed JPEG',
      mimeType: 'image/jpeg',
      estimatedTimeSec: 2,
    },
    {
      format: 'webp',
      label: 'WebP Image',
      extension: '.webp',
      icon: 'globe',
      badge: 'Modern',
      description: 'Compresses graphic into lightweight WebP container',
      mimeType: 'image/webp',
      estimatedTimeSec: 2,
    },
  ],
  txt: [
    {
      format: 'pdf',
      label: 'Adobe PDF',
      extension: '.pdf',
      icon: 'document-text',
      badge: 'Clean',
      description: 'Formats plain text into a paginated PDF layout',
      mimeType: 'application/pdf',
      estimatedTimeSec: 2,
    },
    {
      format: 'docx',
      label: 'Word Document',
      extension: '.docx',
      icon: 'document',
      badge: 'Standard',
      description: 'Packages text into a standard Microsoft Word .docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      estimatedTimeSec: 2,
    },
  ],
};

export function getFormatFromFileName(fileName: string): SourceFormat {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
      return 'pdf';
    case 'docx':
    case 'doc':
      return 'docx';
    case 'xlsx':
    case 'xls':
      return 'xlsx';
    case 'pptx':
    case 'ppt':
      return 'pptx';
    case 'jpg':
    case 'jpeg':
      return 'jpg';
    case 'png':
      return 'png';
    case 'txt':
    default:
      return 'txt';
  }
}

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
