const JSZip = require('jszip');

async function testXlsx() {
  const zip = new JSZip();
  // Shared strings
  const sstXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="3" uniqueCount="3"><si><t>Item</t></si><si><t>Price</t></si><si><t>Apples</t></si></sst>';
  // Sheet
  const sheetXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' +
    '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row>' +
    '<row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2"><v>2.50</v></c></row>' +
    '</sheetData></worksheet>';

  zip.file('xl/sharedStrings.xml', sstXml);
  zip.file('xl/worksheets/sheet1.xml', sheetXml);

  const b64 = await zip.generateAsync({ type: 'base64' });

  // Now parse it back
  const loaded = await JSZip.loadAsync(b64, { base64: true });
  const sstFile = loaded.file('xl/sharedStrings.xml');
  const strings = [];
  if (sstFile) {
    const sstContent = await sstFile.async('string');
    const matches = sstContent.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || [];
    for (const m of matches) {
      strings.push(m.replace(/<[^>]+>/g, ''));
    }
  }

  const sheetFile = loaded.file('xl/worksheets/sheet1.xml');
  const rows = [];
  if (sheetFile) {
    const sheetContent = await sheetFile.async('string');
    const rowMatches = sheetContent.match(/<row[^>]*>[\s\S]*?<\/row>/g) || [];
    for (const r of rowMatches) {
      const cellMatches = r.match(/<c[^>]*>[\s\S]*?<\/c>/g) || [];
      const cells = [];
      for (const c of cellMatches) {
        const isString = c.includes('t="s"');
        const vMatch = c.match(/<v>([\s\S]*?)<\/v>/);
        if (vMatch) {
          const val = vMatch[1];
          if (isString) {
            const idx = parseInt(val, 10);
            cells.push('\"' + (strings[idx] || '').replace(/\"/g, '\"\"') + '\"');
          } else {
            cells.push(val);
          }
        } else {
          cells.push('');
        }
      }
      rows.push(cells.join(','));
    }
  }
  const csv = rows.join('\n');
  console.log('Parsed CSV:');
  console.log(csv);
}

testXlsx();

