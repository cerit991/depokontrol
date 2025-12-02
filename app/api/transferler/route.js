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

export async function GET() {
  try {
    const transfers = readTransfers();
    const sirali = [...transfers].sort((a, b) => {
      const tarihA = new Date(a.olusturmaTarihi).getTime();
      const tarihB = new Date(b.olusturmaTarihi).getTime();
      if (Number.isNaN(tarihA) || Number.isNaN(tarihB)) {
        return 0;
      }
      return tarihB - tarihA;
    });

    return NextResponse.json({ transferler: sirali }, { status: 200 });
  } catch (error) {
    console.error('Transfer listesi alınamadı:', error);
    return NextResponse.json(
      { hata: 'Transfer listesi alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}
