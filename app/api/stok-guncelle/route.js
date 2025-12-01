import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const dataDir = path.join(process.cwd(), 'data');
const urunDbPath = path.join(dataDir, 'urunler.json');
const hareketDbPath = path.join(dataDir, 'stok-hareketleri.json');

function ensureDatabase() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(urunDbPath)) {
    fs.writeFileSync(urunDbPath, JSON.stringify({ urunler: [] }, null, 2));
  }

  if (!fs.existsSync(hareketDbPath)) {
    fs.writeFileSync(hareketDbPath, JSON.stringify({ hareketler: [] }, null, 2));
  }
}

function readJson(filePath) {
  ensureDatabase();
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function appendHareket(kayit) {
  const hareketKaydi = readJson(hareketDbPath);
  hareketKaydi.hareketler.push(kayit);
  writeJson(hareketDbPath, hareketKaydi);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { urunId, eklenenMiktar, not } = body;

    if (!urunId) {
      return NextResponse.json(
        { hata: 'Güncellenecek ürün belirtilmedi' },
        { status: 400 }
      );
    }

    const miktar = Number(eklenenMiktar);
    if (!Number.isFinite(miktar) || miktar <= 0) {
      return NextResponse.json(
        { hata: 'Eklenen miktar pozitif bir sayı olmalıdır' },
        { status: 400 }
      );
    }

    const db = readJson(urunDbPath);
    const urun = db.urunler.find((item) => item.id === urunId || item.barkod === urunId);

    if (!urun) {
      return NextResponse.json(
        { hata: 'Ürün bulunamadı' },
        { status: 404 }
      );
    }

    const simdi = new Date().toISOString();
    const eskiMiktar = Number(urun.miktar) || 0;
    const yeniMiktar = Number((eskiMiktar + miktar).toFixed(2));

    urun.miktar = yeniMiktar;
    urun.guncellemeTarihi = simdi;

    if (!Array.isArray(urun.hareketler)) {
      urun.hareketler = [];
    }

    const hareket = {
      tur: 'stok-artis',
      miktar,
      oncekiMiktar: eskiMiktar,
      yeniMiktar,
      aciklama: not || '',
      tarih: simdi
    };

    urun.hareketler.push(hareket);

    appendHareket({
      ...hareket,
      urunId: urun.id,
      barkod: urun.barkod,
      ad: urun.ad,
      kategori: urun.kategori
    });

    writeJson(urunDbPath, db);

    return NextResponse.json(
      {
        mesaj: 'Stok başarıyla güncellendi',
        urun
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Stok güncelleme hatası:', error);
    return NextResponse.json(
      { hata: 'Stok güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
