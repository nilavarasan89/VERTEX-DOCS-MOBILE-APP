/**
 * Vertex Docs Mobile - File Viewer & Sharing Service
 * Company: JM Vertex Technologies
 * 
 * Ensures converted documents (especially Word .docx and PDF) open seamlessly
 * in external native viewers (Microsoft Word, Google Docs, WPS Office, etc.)
 * by providing exact MIME types, UTI identifiers, and system share intent sheets.
 */

import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Alert } from 'react-native';

export class FileViewerService {
  /**
   * Returns standard IANA MIME type for given format or extension
   */
  public getMimeType(formatOrFileName: string): string {
    const ext = formatOrFileName.includes('.')
      ? formatOrFileName.split('.').pop()?.toLowerCase() || ''
      : formatOrFileName.toLowerCase();

    switch (ext) {
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'doc':
        return 'application/msword';
      case 'pdf':
        return 'application/pdf';
      case 'txt':
        return 'text/plain';
      case 'csv':
        return 'text/csv';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'xls':
        return 'application/vnd.ms-excel';
      case 'png':
        return 'image/png';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'webp':
        return 'image/webp';
      case 'zip':
        return 'application/zip';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Returns Apple Uniform Type Identifier (UTI) for cross-platform compatibility
   */
  public getUTI(formatOrFileName: string): string {
    const ext = formatOrFileName.includes('.')
      ? formatOrFileName.split('.').pop()?.toLowerCase() || ''
      : formatOrFileName.toLowerCase();

    switch (ext) {
      case 'docx':
        return 'org.openxmlformats.wordprocessingml.document';
      case 'pdf':
        return 'com.adobe.pdf';
      case 'txt':
        return 'public.plain-text';
      case 'csv':
        return 'public.comma-separated-values-text';
      case 'png':
        return 'public.png';
      case 'jpg':
      case 'jpeg':
        return 'public.jpeg';
      case 'webp':
        return 'org.webmproject.webp';
      default:
        return 'public.data';
    }
  }

  /**
   * Opens file in external viewer app (Microsoft Word, Google Docs, etc.)
   */
  public async openFile(uri: string, fileName?: string, format?: string): Promise<boolean> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        Alert.alert('File Not Found', 'The requested file could not be located on device storage.');
        return false;
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Viewer Notice', `File is saved at: ${uri}`);
        return false;
      }

      const mimeType = this.getMimeType(format || fileName || uri);
      const uti = this.getUTI(format || fileName || uri);

      await Sharing.shareAsync(uri, {
        mimeType,
        dialogTitle: `Open ${fileName || 'Document'} with...`,
        UTI: uti,
      });

      return true;
    } catch (err: any) {
      console.warn('FileViewerService.openFile error:', err);
      Alert.alert('Could Not Open File', err?.message || 'No compatible application was found to open this document.');
      return false;
    }
  }

  /**
   * Shares file using native share sheet
   */
  public async shareFile(uri: string, fileName?: string, format?: string): Promise<boolean> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        Alert.alert('File Not Found', 'The requested file is no longer available in cache.');
        return false;
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Share Unavailable', 'Sharing is not supported on this platform.');
        return false;
      }

      const mimeType = this.getMimeType(format || fileName || uri);
      const uti = this.getUTI(format || fileName || uri);

      await Sharing.shareAsync(uri, {
        mimeType,
        dialogTitle: `Share ${fileName || 'Document'}`,
        UTI: uti,
      });

      return true;
    } catch (err: any) {
      console.warn('FileViewerService.shareFile error:', err);
      Alert.alert('Share Failed', err?.message || 'Unable to share document.');
      return false;
    }
  }
}

export const fileViewerService = new FileViewerService();

