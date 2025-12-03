import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

export const runtime = 'nodejs';

const urunDbPath = path.join(process.cwd(), 'data', 'urunler.json');
const fontDir = path.join(process.cwd(), 'public', 'fonts');
const regularFontFile = 'RobotoSlab-Regular.ttf';
const boldFontFile = 'RobotoSlab-Bold.ttf';
const regularFontUrl = 'https://github.com/googlefonts/robotoslab/raw/main/fonts/ttf/RobotoSlab-Regular.ttf';
const boldFontUrl = 'https://github.com/googlefonts/robotoslab/raw/main/fonts/ttf/RobotoSlab-Bold.ttf';

const winFontsDir = process.env.WINDIR
  ? path.join(process.env.WINDIR, 'Fonts')
  : undefined;
const systemFontCandidates = {
  regular: [
    winFontsDir && path.join(winFontsDir, 'arial.ttf'),
    winFontsDir && path.join(winFontsDir, 'arialuni.ttf'),
    '/usr/share/fonts/truetype/roboto/RobotoSlab-Regular.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    '/Library/Fonts/Roboto Slab Regular.ttf',
    '/Library/Fonts/RobotoSlab-Regular.ttf',
    '/Library/Fonts/Arial.ttf',
    '/Library/Fonts/Arial Unicode.ttf'
  ],
  bold: [
    winFontsDir && path.join(winFontsDir, 'RobotoSlab-Bold.ttf'),
    winFontsDir && path.join(winFontsDir, 'arialbd.ttf'),
    winFontsDir && path.join(winFontsDir, 'arialbi.ttf'),
    '/usr/share/fonts/truetype/roboto/RobotoSlab-Bold.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    '/Library/Fonts/Roboto Slab Bold.ttf',
    '/Library/Fonts/RobotoSlab-Bold.ttf',
    '/Library/Fonts/Arial Bold.ttf',
    '/Library/Fonts/Arial Bold MT.ttf'
  ]
};

let cachedFontBuffers;

function readUrunler() {
  try {
    if (!fs.existsSync(urunDbPath)) {
      return [];
    }
    const raw = fs.readFileSync(urunDbPath, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.urunler)) {
      return [];
    }
    return parsed.urunler;
  } catch (error) {
    console.error('Ürün verisi okunamadı:', error);
    return [];
  }
}

async function ensureFontBuffers(pdfDoc) {
  if (cachedFontBuffers) {
    return cachedFontBuffers;
  }

  const fallbackRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fallbackBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const ensureFont = async (fileName, remoteUrl, fallback) => {
    const localPath = path.join(fontDir, fileName);
    if (fs.existsSync(localPath)) {
      try {
        const data = fs.readFileSync(localPath);
        return await pdfDoc.embedFont(data, { subset: false });
      } catch (error) {
        console.warn('Yerel font gömülemedi, fallback kullanılacak:', error);
        return fallback;
      }
    }

    const candidates = fileName === regularFontFile
      ? systemFontCandidates.regular
      : systemFontCandidates.bold;

    for (const candidate of candidates) {
      if (!candidate) continue;
      try {
        if (fs.existsSync(candidate)) {
          const buffer = fs.readFileSync(candidate);
          fs.mkdirSync(fontDir, { recursive: true });
          fs.writeFileSync(localPath, buffer);
          return await pdfDoc.embedFont(buffer, { subset: false });
        }
      } catch (candidateError) {
        console.warn(`Sistem fontu gömülemedi (${candidate}):`, candidateError);
      }
    }

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
        console.warn('Font indirildi ancak diske yazılamadı:', writeError);
      }

      return await pdfDoc.embedFont(buffer, { subset: false });
    } catch (downloadError) {
      console.error('Font indirilemedi, fallback kullanılacak:', downloadError);
      return fallback;
    }
  };

  const regular = await ensureFont(regularFontFile, regularFontUrl, fallbackRegular);
  const bold = await ensureFont(boldFontFile, boldFontUrl, fallbackBold);

  cachedFontBuffers = { regular, bold };
  return cachedFontBuffers;
}

const formatAmount = (value) => {
  if (value === null || value === undefined) {
    return '-';
  }

  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) {
    return '-';
  }

  const formatted = numberValue.toLocaleString('tr-TR', {
    maximumFractionDigits: 2,
    minimumFractionDigits: numberValue % 1 === 0 ? 0 : 2
  });

  return formatted;
};

async function buildPdf(urunler) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const { regular, bold } = await ensureFontBuffers(pdfDoc);

  const margin = 40;
  const lineHeight = 15;
  const pageSize = [595.28, 841.89];
  let page = pdfDoc.addPage(pageSize);
  let cursorY = page.getHeight() - margin;

    const columnHeaders = ['Ürün Adı', 'Kategori', 'Miktar', '   Kalan Miktar'];
    const columnWidths = [260, 140, 30, 195];
  const tableWidth = columnWidths.reduce((total, width) => total + width, 0);
  const columnPositions = columnWidths.reduce(
    (positions, width) => {
      positions.push(positions[positions.length - 1] + width);
      return positions;
    },
    [margin]
  );

  const ensurePageSpace = (minSpace) => {
    if (cursorY < margin + minSpace) {
      page = pdfDoc.addPage(pageSize);
      cursorY = page.getHeight() - margin;
      drawTableHeader();
    }
  };

  const drawText = (text, options = {}) => {
    const {
      size = 7,
      font = regular,
      x = margin,
      y = cursorY,
      advance = true,
      lineGap = lineHeight
    } = options;

    page.drawText(text, { x, y, size, font });
    if (advance) {
      cursorY -= lineGap;
    }
  };

  const drawDivider = (y) => {
    page.drawLine({
      start: { x: margin, y },
      end: { x: margin + tableWidth, y },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8)
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
    ensurePageSpace(lineHeight * 2.5);

    const rowTop = cursorY;
    let headerX = margin;
    columnHeaders.forEach((header, index) => {
      drawText(header, {
        x: headerX,
        font: bold,
        size: 10,
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

  const drawTitle = () => {
    const title = 'Depo Ürün Listesi';
    const generatedAt = `Oluşturulma: ${new Date().toLocaleString('tr-TR')}`;
    const titleSize = 16;
    const centerX = (page.getWidth() - bold.widthOfTextAtSize(title, titleSize)) / 2;

    drawText(title, { x: centerX, font: bold, size: titleSize, advance: true });
    cursorY -= 6;
    drawText(generatedAt, {
      x: (page.getWidth() - regular.widthOfTextAtSize(generatedAt, 9)) / 2,
      size: 9,
      advance: true
    });
    cursorY -= 10;
    drawDivider(cursorY);
    cursorY -= 20;
  };

  drawTitle();
  drawTableHeader();

  urunler.forEach((urun, index) => {
    ensurePageSpace(lineHeight * 2);

    const rowTop = cursorY;
    const rowBottom = rowTop - lineHeight;

    if (index % 2 === 1) {
      page.drawRectangle({
        x: margin,
        y: rowBottom + 1,
        width: tableWidth,
        height: Math.max(lineHeight - 10, 12),
        color: rgb(0.95, 0.96, 0.98)
      });
    }

    let currentX = margin;
    const rowValues = [
      urun.ad,
      urun.kategori || '-',
      formatAmount(urun.miktar),
      ''
    ];

    rowValues.forEach((value, colIndex) => {
      const text = String(value);
      const colWidth = columnWidths[colIndex];
      let adjustedText = text;
      const maxWidth = colWidth - 8;

      if (regular.widthOfTextAtSize(adjustedText, 10) > maxWidth) {
        while (adjustedText.length > 3 && regular.widthOfTextAtSize(`${adjustedText}…`, 10) > maxWidth) {
          adjustedText = adjustedText.slice(0, -1);
        }
        adjustedText = `${adjustedText}…`;
      }

      const alignmentOffset = colIndex === 2
        ? (colWidth - regular.widthOfTextAtSize(adjustedText, 10)) / 2
        : 0;

      drawText(adjustedText, {
        x: currentX + Math.max(alignmentOffset, 0),
        y: cursorY,
        size: 10,
        advance: false
      });
      currentX += colWidth;
    });

    cursorY -= lineHeight;
    const newRowBottom = cursorY;
    drawDivider(newRowBottom + lineHeight * 0.85);
    drawColumnDividers(rowTop + lineHeight * 0.4, newRowBottom + lineHeight * 0.1);
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export async function GET() {
  try {
    const urunler = readUrunler();

    if (!urunler.length) {
      return NextResponse.json(
        { hata: 'Listelenecek ürün bulunamadı' },
        { status: 404 }
      );
    }

    const pdfBuffer = await buildPdf(urunler);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="urun-listesi.pdf"'
      }
    });
  } catch (error) {
    console.error('Ürün PDF üretim hatası:', error);
    return NextResponse.json(
      { hata: 'Ürün PDF\'i oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
}
