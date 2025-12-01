import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

const dataDir = path.join(process.cwd(), 'data');
const urunDbPath = path.join(dataDir, 'urunler.json');
const transferDbPath = path.join(dataDir, 'transfers.json');

function initializeFiles() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(urunDbPath)) {
    fs.writeFileSync(urunDbPath, JSON.stringify({ urunler: [] }, null, 2));
  }

  if (!fs.existsSync(transferDbPath)) {
    fs.writeFileSync(transferDbPath, JSON.stringify({ transfers: [] }, null, 2));
  }
}

function readJson(filePath) {
  initializeFiles();
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { teslimEden, teslimAlan, hedefKonum, aciklama, urunler } = body;

    if (!teslimEden || !teslimAlan || !hedefKonum) {
      return NextResponse.json(
        { hata: 'Teslim eden, teslim alan ve hedef konum alanları zorunludur' },
        { status: 400 }
      );
    }

    if (!Array.isArray(urunler) || urunler.length === 0) {
      return NextResponse.json(
        { hata: 'Transfer için en az bir ürün seçilmelidir' },
        { status: 400 }
      );
    }

    const urunDb = readJson(urunDbPath);
    const transferDb = readJson(transferDbPath);

    const transferKalemleri = [];
    const simdi = new Date().toISOString();

    for (const item of urunler) {
      const miktar = Number(item.miktar);
      if (!item.id || isNaN(miktar) || miktar <= 0) {
        return NextResponse.json(
          { hata: 'Geçersiz ürün miktarı gönderildi' },
          { status: 400 }
        );
      }

      const urunKaydi = urunDb.urunler.find((urun) => urun.id === item.id);
      if (!urunKaydi) {
        return NextResponse.json(
          { hata: `Ürün bulunamadı: ${item.id}` },
          { status: 404 }
        );
      }

      if (urunKaydi.miktar < miktar) {
        return NextResponse.json(
          {
            hata: `${urunKaydi.ad} ürünü için yeterli miktar bulunmuyor. Depodaki: ${urunKaydi.miktar}`
          },
          { status: 400 }
        );
      }

      urunKaydi.miktar = Number((urunKaydi.miktar - miktar).toFixed(2));
      urunKaydi.guncellemeTarihi = simdi;

      transferKalemleri.push({
        id: urunKaydi.id,
        ad: urunKaydi.ad,
        barkod: urunKaydi.barkod,
        kategori: urunKaydi.kategori,
        birim: urunKaydi.birim,
        miktar,
        kalanMiktar: urunKaydi.miktar
      });
    }

    writeJson(urunDbPath, urunDb);

    const transferKaydi = {
      id: `TR${Date.now()}`,
      teslimEden,
      teslimAlan,
      hedefKonum,
      aciklama: aciklama || '',
      urunler: transferKalemleri,
      olusturmaTarihi: simdi
    };

    transferDb.transfers.push(transferKaydi);
    writeJson(transferDbPath, transferDb);

    return NextResponse.json(
      {
        mesaj: 'Transfer başarıyla oluşturuldu',
        transfer: transferKaydi
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Transfer oluşturma hatası:', error);
    return NextResponse.json(
      { hata: 'Transfer oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
}
