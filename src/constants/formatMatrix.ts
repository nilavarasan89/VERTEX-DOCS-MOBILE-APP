/**
 * Vertex Docs Mobile - Format Conversion Matrix
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
    description: 'Word Document',
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
      description: 'Fully editable Word file with intact styles and tables',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      estimatedTimeSec: 4,
    },
    {
      format: 'pptx',
      label: 'PowerPoint Deck',
      extension: '.pptx',
      icon: 'easel',
      badge: 'PRO',
      description: 'Converts each PDF page into a presentation slide',
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      estimatedTimeSec: 5,
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
      format: 'png',
      label: 'PNG Images',
      extension: '.png',
      icon: 'images',
      description: 'Renders high-resolution lossless image pages',
      mimeType: 'image/png',
      estimatedTimeSec: 4,
    },
    {
      format: 'jpg',
      label: 'JPEG Images',
      extension: '.jpg',
      icon: 'image',
      description: 'Compresses pages into lightweight photos',
      mimeType: 'image/jpeg',
      estimatedTimeSec: 3,
    },
  ],
  docx: [
    {
      format: 'pdf',
      label: 'Adobe PDF',
      extension: '.pdf',
      icon: 'document-text',
      badge: 'Standard',
      description: 'Preserves fonts, margins, headings, and vectors',
      mimeType: 'application/pdf',
      estimatedTimeSec: 3,
    },
    {
      format: 'txt',
      label: 'Plain Text',
      extension: '.txt',
      icon: 'newspaper',
      description: 'Extracts stripped text content ready for translation',
      mimeType: 'text/plain',
      estimatedTimeSec: 1,
    },
  ],
  pptx: [
    {
      format: 'pdf',
      label: 'Adobe PDF',
      extension: '.pdf',
      icon: 'document-text',
      badge: 'Standard',
      description: 'Generates print-ready slide handouts with preserved graphics',
      mimeType: 'application/pdf',
      estimatedTimeSec: 4,
    },
    {
      format: 'docx',
      label: 'Word Document',
      extension: '.docx',
      icon: 'document',
      badge: 'Outline',
      description: 'Extracts slide speaker notes and slide outlines into Word',
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
      badge: 'Photo to Doc',
      description: 'Combines scanned photos into a clean PDF page',
      mimeType: 'application/pdf',
      estimatedTimeSec: 2,
    },
  ],
  png: [
    {
      format: 'pdf',
      label: 'Adobe PDF',
      extension: '.pdf',
      icon: 'document-text',
      badge: 'Lossless',
      description: 'Generates crisp vector-ready PDF from screenshot or diagram',
      mimeType: 'application/pdf',
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
      description: 'Formats plain text into a professional document layout',
      mimeType: 'application/pdf',
      estimatedTimeSec: 2,
    },
    {
      format: 'docx',
      label: 'Word Document',
      extension: '.docx',
      icon: 'document',
      description: 'Imports text into a standard Microsoft Word document',
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
