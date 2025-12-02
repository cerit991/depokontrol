import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const transferDbPath = path.join(process.cwd(), 'data', 'transfers.json');

function readTransfers() {
  try {
    if (!fs.existsSync(transferDbPath)) {
      return [];
    }
    const raw = fs.readFileSync(transferDbPath, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.transfers)) {
      return [];
    }
    return parsed.transfers;
  } catch (error) {
    console.error('Transfer verisi okunamadı:', error);
    return [];
  }
}

export async function GET(request, context = {}) {
  try {
    const paramsInput = context?.params;
    const params = paramsInput && typeof paramsInput.then === 'function'
      ? await paramsInput
      : paramsInput || {};

    let transferId = params?.transferId;

    if (!transferId) {
      try {
        const url = request.nextUrl ?? new URL(request.url);
        transferId = url.searchParams.get('id') || url.searchParams.get('transferId');
      } catch (parseError) {
        console.warn('Transfer ID için query param okunamadı:', parseError);
      }
    }

    if (!transferId) {
      return NextResponse.json(
        { hata: 'Transfer kimliği belirtilmedi' },
        { status: 400 }
      );
    }

    const transfers = readTransfers();
    const transfer = transfers.find((item) => String(item.id) === String(transferId));

    if (!transfer) {
      return NextResponse.json(
        { hata: 'Transfer bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({ transfer }, { status: 200 });
  } catch (error) {
    console.error('Transfer getirilemedi:', error);
    return NextResponse.json(
      { hata: 'Transfer bilgisi alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}
