/**
 * Vertex Docs Mobile - XLSX Service
 * Company: JM Vertex Technologies
 * 
 * Extracts worksheet tables and rows from Microsoft Excel (.xlsx) files
 * and converts them to standard Comma-Separated Values (CSV).
 */

import JSZip from 'jszip';
import * as FileSystem from 'expo-file-system/legacy';

export class XlsxService {
  /**
   * Converts an XLSX file into a CSV file
   */
  public async convertXlsxToCsv(
    uri: string,
    outputFileName?: string
  ): Promise<{ uri: string; size: number; rowCount: number; fileName: string; preview: string }> {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const zip = await JSZip.loadAsync(base64, { base64: true });

      // 1. Extract shared strings if present
      const strings: string[] = [];
      const sstFile = zip.file('xl/sharedStrings.xml');
      if (sstFile) {
        const sstContent = await sstFile.async('string');
        const matches = sstContent.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || [];
        for (const m of matches) {
          strings.push(m.replace(/<[^>]+>/g, ''));
        }
      }

      // 2. Extract first sheet
      const sheetFile =
        zip.file('xl/worksheets/sheet1.xml') ||
        zip.file(/^xl\/worksheets\/sheet.*\.xml$/i)[0];

      if (!sheetFile) {
        throw new Error('No worksheets found in this Excel workbook.');
      }

      const sheetContent = await sheetFile.async('string');
      const rowMatches = sheetContent.match(/<row[^>]*>[\s\S]*?<\/row>/g) || [];
      const csvRows: string[] = [];

      for (const r of rowMatches) {
        const cellMatches = r.match(/<c[^>]*>[\s\S]*?<\/c>/g) || [];
        const cells: string[] = [];

        for (const c of cellMatches) {
          const isString = c.includes('t="s"');
          const isInline = c.includes('t="inlineStr"');

          if (isInline) {
            const tMatch = c.match(/<t[^>]*>([\s\S]*?)<\/t>/);
            const val = tMatch ? tMatch[1] : '';
            cells.push('"' + val.replace(/"/g, '""') + '"');
          } else {
            const vMatch = c.match(/<v>([\s\S]*?)<\/v>/);
            if (vMatch) {
              const val = vMatch[1];
              if (isString) {
                const idx = parseInt(val, 10);
                const sVal = strings[idx] || '';
                cells.push('"' + sVal.replace(/"/g, '""') + '"');
              } else {
                cells.push(val);
              }
            } else {
              cells.push('');
            }
          }
        }
        if (cells.some((cell) => cell.length > 0)) {
          csvRows.push(cells.join(','));
        }
      }

      const csvContent =
        csvRows.length > 0 ? csvRows.join('\n') : 'Column 1,Column 2\nNo data rows,0\n';

      const outputDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
      const safeFileName = outputFileName || `Spreadsheet_${Date.now()}.csv`;
      const targetPath = `${outputDir}${safeFileName}`;

      await FileSystem.writeAsStringAsync(targetPath, csvContent, {
        encoding: 'utf8' as any,
      });

      const fileInfo = await FileSystem.getInfoAsync(targetPath);
      const size =
        fileInfo.exists && 'size' in fileInfo ? fileInfo.size : csvContent.length;

      return {
        uri: targetPath,
        size,
        rowCount: csvRows.length,
        fileName: safeFileName,
        preview: csvRows.slice(0, 5).join('\n'),
      };
    } catch (err: any) {
      console.warn('convertXlsxToCsv error:', err);
      throw new Error(`Failed to process XLSX document: ${err?.message || err}`);
    }
  }
}

export const xlsxService = new XlsxService();
