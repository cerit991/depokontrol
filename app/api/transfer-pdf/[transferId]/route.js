import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

export const runtime = 'nodejs';

const transferDbPath = path.join(process.cwd(), 'data', 'transfers.json');
const fontDir = path.join(process.cwd(), 'public', 'fonts');
const regularFontFile = 'Roboto-Regular.ttf';
const boldFontFile = 'Roboto-Bold.ttf';
const regularFontUrl = 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxM.ttf';
const boldFontUrl = 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc9.ttf';

const winFontsDir = process.env.WINDIR
  ? path.join(process.env.WINDIR, 'Fonts')
  : undefined;
const systemFontCandidates = {
  regular: [
    winFontsDir && path.join(winFontsDir, 'arial.ttf'),
    winFontsDir && path.join(winFontsDir, 'arialuni.ttf'),
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    '/Library/Fonts/Arial.ttf',
    '/Library/Fonts/Arial Unicode.ttf'
  ],
  bold: [
    winFontsDir && path.join(winFontsDir, 'arialbd.ttf'),
    winFontsDir && path.join(winFontsDir, 'arialbi.ttf'),
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    '/Library/Fonts/Arial Bold.ttf',
    '/Library/Fonts/Arial Bold MT.ttf'
  ]
};

let cachedFontBuffers;

function readTransfers() {
  if (!fs.existsSync(transferDbPath)) {
    return { transfers: [] };
  }
  const raw = fs.readFileSync(transferDbPath, 'utf8');
  try {
    const parsed = JSON.parse(raw || '{}');
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.transfers)) {
      return { transfers: [] };
    }
    return { transfers: parsed.transfers };
  } catch (error) {
    console.error('Transfer verisi okunamadı, varsayılan kullanılacak:', error);
    return { transfers: [] };
  }
}

function formatDate(date) {
  return new Date(date).toLocaleString('tr-TR');
}

async function ensureFontBuffers() {
  if (cachedFontBuffers) {
    return cachedFontBuffers;
  }

  const ensureFont = async (fileName, remoteUrl) => {
    const localPath = path.join(fontDir, fileName);
    if (fs.existsSync(localPath)) {
      return fs.readFileSync(localPath);
    }

     const candidates = fileName === regularFontFile
      ? systemFontCandidates.regular
      : systemFontCandidates.bold;
    for (const candidate of candidates) {
      if (!candidate) continue;
      try {
        if (fs.existsSync(candidate)) {
          return fs.readFileSync(candidate);
        }
      } catch (candidateError) {
        console.warn(`Sistem fontu okunamadı (${candidate}):`, candidateError);
      }
    }

    // Fallback to CDN when font is missing locally so Turkish glyphs are always available.
    try {
      const response = await fetch(remoteUrl);
      if (!response.ok) {
        throw new Error(`CDN response ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      try {
        fs.mkdirSync(fontDir, { recursive: true });
        fs.writeFileSync(localPath, buffer);
      } catch (writeError) {
        console.warn('Font yazma işlemi başarısız, bellekte kullanılacak:', writeError);
      }

      return buffer;
    } catch (downloadError) {
      console.error(`Uzak font indirilemedi (${remoteUrl}):`, downloadError);
      return undefined;
    }
  };

  const [regular, bold] = await Promise.all([
    ensureFont(regularFontFile, regularFontUrl),
    ensureFont(boldFontFile, boldFontUrl)
  ]);

  cachedFontBuffers = { regular, bold };

  return cachedFontBuffers;
}

async function buildPdf(transfer) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const fontBuffers = await ensureFontBuffers();
  const fallbackRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fallbackBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const font = fontBuffers.regular
    ? await pdfDoc.embedFont(fontBuffers.regular, { subset: false })
    : fallbackRegular;
  const boldFont = fontBuffers.bold
    ? await pdfDoc.embedFont(fontBuffers.bold, { subset: false })
    : fallbackBold;

  const formatAmount = (value, unit) => {
    if (value === null || value === undefined) {
      return 'Bilinmiyor';
    }
    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) {
      return 'Bilinmiyor';
    }
    const options = {
      maximumFractionDigits: 2,
      minimumFractionDigits: numberValue % 1 === 0 ? 0 : 2
    };
    return `${numberValue.toLocaleString('tr-TR', options)} ${unit ?? ''}`.trim();
  };

  const margin = 50;
  const lineHeight = 18;
  const pageSize = [595.28, 841.89];
  let page = pdfDoc.addPage(pageSize);
  let cursorY = page.getHeight() - margin;
  const columnHeaders = ['Ürün Adı', 'Teslim Edilen', 'Depoda Kalan'];
  const columnWidths = [260, 140, 140];
  const tableWidth = columnWidths.reduce((total, width) => total + width, 0);
  const columnPositions = columnWidths.reduce(
    (positions, width) => {
      positions.push(positions[positions.length - 1] + width);
      return positions;
    },
    [margin]
  );

  const newPage = () => {
    page = pdfDoc.addPage(pageSize);
    cursorY = page.getHeight() - margin;
  };

  const drawText = (text, options = {}) => {
    const {
      size = 12,
      font: selectedFont = font,
      x = margin,
      y = cursorY,
      lineGap = lineHeight,
      advance = true
    } = options;

    page.drawText(text, {
      x,
      y,
      size,
      font: selectedFont
    });

    if (advance) {
      cursorY -= lineGap;
    }
  };

  const drawCentered = (text, size = 20) => {
    const textWidth = boldFont.widthOfTextAtSize(text, size);
    const x = (page.getWidth() - textWidth) / 2;
    page.drawText(text, {
      x,
      y: cursorY,
      size,
      font: boldFont
    });
    cursorY -= lineHeight;
  };

  drawCentered('Depo Transfer Formu', 22);
  cursorY -= 10;

  drawText(`Transfer No: ${transfer.id}`);
  drawText(`Oluşturulma Tarihi: ${formatDate(transfer.olusturmaTarihi)}`);
  drawText(`Teslim Eden: ${transfer.teslimEden}`);
  drawText(`Teslim Alan: ${transfer.teslimAlan}`);
  drawText(`Hedef Konum: ${transfer.hedefKonum}`);
  if (transfer.aciklama) {
    drawText(`Not: ${transfer.aciklama}`);
  }

  cursorY -= 4;
  const sectionDivider = () => {
    page.drawLine({
      start: { x: margin, y: cursorY },
      end: { x: margin + tableWidth, y: cursorY },
      thickness: 0.75,
      color: rgb(0.65, 0.65, 0.65)
    });
    cursorY -= 14;
  };

  sectionDivider();

  cursorY -= 10;
  drawText('Ürün Listesi', { size: 14, font: boldFont });
  cursorY -= 6;

  const drawDivider = (y) => {
    page.drawLine({
      start: { x: margin, y },
      end: { x: margin + tableWidth, y },
      thickness: 0.5,
      color: rgb(0.75, 0.75, 0.75)
    });
  };

  const drawColumnDividers = (topY, bottomY) => {
    columnPositions.forEach((x, index) => {
      if (index === 0 || index === columnPositions.length - 1) {
        return;
      }
      page.drawLine({
        start: { x, y: topY },
        end: { x, y: bottomY },
        thickness: 0.5,
        color: rgb(0.85, 0.85, 0.85)
      });
    });
  };

  const drawTableHeader = () => {
    const rowTop = cursorY;
    let headerX = margin;
    columnHeaders.forEach((header, index) => {
      drawText(header, {
        x: headerX,
        font: boldFont,
        size: 12,
        y: cursorY,
        advance: false
      });
      headerX += columnWidths[index];
    });
    cursorY -= lineHeight;
    const rowBottom = cursorY;
    drawDivider(rowBottom + lineHeight * 0.85);
    drawColumnDividers(rowTop + lineHeight * 0.4, rowBottom + lineHeight * 0.1);
  };

  drawTableHeader();

  transfer.urunler.forEach((urun) => {
    const rowTop = cursorY;
    let currentX = margin;
    const rowValues = [
      urun.ad,
      formatAmount(urun.miktar, urun.birim),
      formatAmount(urun.kalanMiktar, urun.birim)
    ];

    rowValues.forEach((value, index) => {
      drawText(String(value), {
        x: currentX,
        size: 11,
        y: cursorY,
        advance: false
      });
      currentX += columnWidths[index];
    });

    cursorY -= lineHeight;
    const rowBottom = cursorY;
    drawDivider(rowBottom + lineHeight * 0.85);
    drawColumnDividers(rowTop + lineHeight * 0.4, rowBottom + lineHeight * 0.1);

    if (cursorY < margin + 80) {
      newPage();
      drawTableHeader();
    }
  });

  cursorY -= 20;
  sectionDivider();
  cursorY -= 45;
  drawText('Teslim Eden İmza: __________________________');
  cursorY -= 55;
  drawText('Teslim Alan İmza: __________________________');

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export async function GET(request, context) {
  try {
    const { transferId } = await context.params;
    const transferDb = readTransfers();
    const transfer = transferDb.transfers.find((item) => item.id === transferId);

    if (!transfer) {
      return NextResponse.json({ hata: 'Transfer bulunamadı' }, { status: 404 });
    }

    const pdfBuffer = await buildPdf(transfer);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="transfer-${transfer.id}.pdf"`
      }
    });
  } catch (error) {
    console.error('PDF oluşturma hatası:', error);
    return NextResponse.json(
      { hata: 'PDF oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
}
