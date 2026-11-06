const { PDFDocument, PDFArray, decodePDFRawStream } = require('pdf-lib');

function parsePdfStream(bytes) {
  const streamText = Buffer.from(bytes).toString('latin1');
  const textChunks = [];
  const btRegex = /BT[\s\S]*?ET/g;
  let blockMatch;
  while ((blockMatch = btRegex.exec(streamText)) !== null) {
    const block = blockMatch[0];
    const tjRegex = /(?:\((.*?)\)|<([0-9a-fA-F]+)>)\s*Tj/g;
    let match;
    while ((match = tjRegex.exec(block)) !== null) {
      if (match[1] !== undefined) {
        textChunks.push(match[1].replace(/\\([()\\])/g, '$1'));
      } else if (match[2] !== undefined) {
        let hex = match[2];
        let str = '';
        for (let i = 0; i < hex.length; i += 2) {
          str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        textChunks.push(str);
      }
    }
  }
  return textChunks.join('\n');
}

async function run() {
  const doc = await PDFDocument.create();
  const page = doc.addPage();
  page.drawText('Sample invoice text for testing extraction');
  const b64 = await doc.saveAsBase64();

  const loaded = await PDFDocument.load(b64);
  const p1 = loaded.getPages()[0];
  const contents = p1.node.Contents();
  const refs = contents instanceof PDFArray ? contents.asArray() : [contents];
  for (const ref of refs) {
    const rawStream = loaded.context.lookup(ref);
    const decoded = decodePDFRawStream(rawStream);
    const parsed = parsePdfStream(decoded.decode());
    console.log('Parsed text from PDF:');
    console.log(parsed);
  }
}

run();

