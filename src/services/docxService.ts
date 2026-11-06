/**
 * Vertex Docs Mobile - DOCX Service (OpenXML)
 * Company: JM Vertex Technologies
 * 
 * Generates and parses genuine Microsoft Word (.docx) OpenXML archives
 * using JSZip and standard OpenXML schemas.
 */

import JSZip from 'jszip';
import * as FileSystem from 'expo-file-system/legacy';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

const RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const DOCUMENT_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
        <w:color w:val="1F2937"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="160" w:line="276" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:rPr>
      <w:b/>
      <w:color w:val="1E40AF"/>
      <w:sz w:val="32"/>
      <w:szCs w:val="32"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:rPr>
      <w:b/>
      <w:color w:val="2563EB"/>
      <w:sz w:val="26"/>
      <w:szCs w:val="26"/>
    </w:rPr>
  </w:style>
</w:styles>`;

export class DocxService {
  /**
   * Generates a valid Microsoft Word (.docx) document containing paragraphs
   */
  public async generateDocx(
    paragraphs: string[],
    options?: { title?: string; fileName?: string }
  ): Promise<{ uri: string; size: number; fileName: string }> {
    const zip = new JSZip();

    zip.file('[Content_Types].xml', CONTENT_TYPES_XML);
    zip.file('_rels/.rels', RELS_XML);
    zip.file('word/_rels/document.xml.rels', DOCUMENT_RELS_XML);
    zip.file('word/styles.xml', STYLES_XML);

    let docBody = '';

    if (options?.title) {
      docBody += `
      <w:p>
        <w:pPr>
          <w:pStyle w:val="Heading1"/>
        </w:pPr>
        <w:r>
          <w:t xml:space="preserve">${escapeXml(options.title)}</w:t>
        </w:r>
      </w:p>`;
    }

    const cleanParagraphs =
      paragraphs.length > 0 ? paragraphs : ['(Document contains no text)'];

    for (const paragraph of cleanParagraphs) {
      const trimmed = paragraph.trim();
      if (!trimmed) {
        docBody += `<w:p/>`;
        continue;
      }

      // Detect simple heading style
      const isHeading =
        trimmed.startsWith('# ') ||
        (trimmed === trimmed.toUpperCase() && trimmed.length < 50 && !trimmed.includes('.'));

      const headingText = trimmed.startsWith('# ') ? trimmed.substring(2) : trimmed;

      if (isHeading) {
        docBody += `
        <w:p>
          <w:pPr>
            <w:pStyle w:val="Heading2"/>
          </w:pPr>
          <w:r>
            <w:t xml:space="preserve">${escapeXml(headingText)}</w:t>
          </w:r>
        </w:p>`;
      } else {
        docBody += `
        <w:p>
          <w:r>
            <w:t xml:space="preserve">${escapeXml(trimmed)}</w:t>
          </w:r>
        </w:p>`;
      }
    }

    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${docBody}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

    zip.file('word/document.xml', documentXml);

    const base64Data = await zip.generateAsync({
      type: 'base64',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const outputDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
    const safeFileName = options?.fileName || `VertexDoc_${Date.now()}.docx`;
    const targetPath = `${outputDir}${safeFileName}`;

    await FileSystem.writeAsStringAsync(targetPath, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const fileInfo = await FileSystem.getInfoAsync(targetPath);
    const size = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : base64Data.length * 0.75;

    return {
      uri: targetPath,
      size,
      fileName: safeFileName,
    };
  }

  /**
   * Extracts clean text and paragraphs from an existing .docx file
   */
  public async extractTextFromDocx(uri: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const zip = await JSZip.loadAsync(base64, { base64: true });
      const documentFile = zip.file('word/document.xml');

      if (!documentFile) {
        throw new Error('Invalid DOCX: missing word/document.xml');
      }

      const xml = await documentFile.async('string');

      // Parse paragraphs from XML
      const paragraphs: string[] = [];
      const pMatches = xml.match(/<w:p[\s\S]*?<\/w:p>/g) || [];

      for (const pXml of pMatches) {
        const tMatches = pXml.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
        const textParts: string[] = [];
        for (const tXml of tMatches) {
          const content = tXml.replace(/<[^>]+>/g, '');
          textParts.push(content);
        }
        const paragraphText = textParts.join('').trim();
        if (paragraphText.length > 0) {
          paragraphs.push(paragraphText);
        }
      }

      return paragraphs.join('\n\n');
    } catch (err: any) {
      console.warn('extractTextFromDocx error:', err);
      throw new Error(`Failed to read DOCX file: ${err?.message || err}`);
    }
  }

  /**
   * Validates that a file at the given URI is a valid DOCX container
   */
  public async validateDocx(
    uri: string
  ): Promise<{ isValid: boolean; size: number; paragraphCount: number }> {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (!info.exists) {
        return { isValid: false, size: 0, paragraphCount: 0 };
      }

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const zip = await JSZip.loadAsync(base64, { base64: true });
      const hasDocXml = zip.file('word/document.xml') !== null;
      const hasContentTypes = zip.file('[Content_Types].xml') !== null;

      if (!hasDocXml || !hasContentTypes) {
        return { isValid: false, size: 'size' in info ? info.size : 0, paragraphCount: 0 };
      }

      const docText = await zip.file('word/document.xml')!.async('string');
      const pCount = (docText.match(/<w:p[\s\S]*?<\/w:p>/g) || []).length;

      return {
        isValid: true,
        size: 'size' in info ? info.size : 0,
        paragraphCount: pCount,
      };
    } catch {
      return { isValid: false, size: 0, paragraphCount: 0 };
    }
  }
}

export const docxService = new DocxService();
