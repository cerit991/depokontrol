import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Veritabanı dosyası yolları
const dbPath = path.join(process.cwd(), 'data', 'urunler.json');
const hareketDbPath = path.join(process.cwd(), 'data', 'stok-hareketleri.json');

// Data klasörünü ve gerekli dosyaları oluştur
function initializeDatabase() {
  const dataDir = path.join(process.cwd(), 'data');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ urunler: [] }, null, 2));
  }

  if (!fs.existsSync(hareketDbPath)) {
    fs.writeFileSync(hareketDbPath, JSON.stringify({ hareketler: [] }, null, 2));
  }
}

function readUrunler() {
  initializeDatabase();
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    const parsed = JSON.parse(data || '{}');
    if (!Array.isArray(parsed.urunler)) {
      return { urunler: [] };
    }
    return parsed;
  } catch (error) {
    console.error('Ürünler okunamadı, varsayılan kullanılacak:', error);
    return { urunler: [] };
  }
}

function writeUrunler(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function readHareketler() {
  initializeDatabase();
  try {
    const raw = fs.readFileSync(hareketDbPath, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    if (!Array.isArray(parsed.hareketler)) {
      return { hareketler: [] };
    }
    return parsed;
  } catch (error) {
    console.error('Stok hareketleri okunamadı, varsayılan kullanılacak:', error);
    return { hareketler: [] };
  }
}

function appendHareket(kayit) {
  const hareketDb = readHareketler();
  hareketDb.hareketler.push(kayit);
  fs.writeFileSync(hareketDbPath, JSON.stringify(hareketDb, null, 2));
}

// Metinleri kıyaslamak için normalize et
const normalizeText = (value) =>
  (value ?? '')
    .toString()
    .trim()
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

function generateBarcode(existingBarcodes) {
  let barkod;
  do {
    barkod = `BRK${Math.random().toString().slice(2, 12)}`;
  } while (existingBarcodes.has(barkod));
  return barkod;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { ad, kategori, birim, miktar } = body ?? {};

    if (!ad || !kategori || miktar === undefined || miktar === null || miktar === '') {
      return NextResponse.json(
        { hata: 'Gerekli alanlar eksik' },
        { status: 400 }
      );
    }

    const girilenMiktar = Number(miktar);
    if (!Number.isFinite(girilenMiktar) || girilenMiktar <= 0) {
      return NextResponse.json(
        { hata: 'Miktar pozitif bir sayı olmalıdır' },
        { status: 400 }
      );
    }

    const database = readUrunler();
    if (!Array.isArray(database.urunler)) {
      database.urunler = [];
    }

    const varsayilanBirim = birim || 'adet';
    const adKiyas = normalizeText(ad);
    const kategoriKiyas = normalizeText(kategori);

    const mevcutUrun = database.urunler.find((urun) =>
      normalizeText(urun.ad) === adKiyas &&
      normalizeText(urun.kategori) === kategoriKiyas &&
      (urun.birim || 'adet') === varsayilanBirim
    );

    const simdi = new Date().toISOString();

    if (mevcutUrun) {
      const oncekiMiktar = Number(mevcutUrun.miktar) || 0;
      mevcutUrun.miktar = Number((oncekiMiktar + girilenMiktar).toFixed(2));
      mevcutUrun.guncellemeTarihi = simdi;

      if (!Array.isArray(mevcutUrun.hareketler)) {
        mevcutUrun.hareketler = [];
      }

      const hareket = {
        tur: 'urun-ekleme',
        miktar: girilenMiktar,
        oncekiMiktar,
        yeniMiktar: mevcutUrun.miktar,
        aciklama: 'Ürün ekleme formu üzerinden stok arttırma',
        tarih: simdi
      };

      mevcutUrun.hareketler.push(hareket);
      appendHareket({
        ...hareket,
        urunId: mevcutUrun.id,
        barkod: mevcutUrun.barkod,
        ad: mevcutUrun.ad,
        kategori: mevcutUrun.kategori,
        birim: mevcutUrun.birim || 'adet',
        kaynak: 'urun-ekle'
      });

      writeUrunler(database);

      return NextResponse.json(
        {
          mesaj: 'Mevcut ürün stoğu güncellendi',
          urun: mevcutUrun,
          guncellendi: true
        },
        { status: 200 }
      );
    }

    const mevcutBarkodlar = new Set(
      database.urunler.map((urun) => urun.barkod).filter(Boolean)
    );
    const otomatikBarkod = generateBarcode(mevcutBarkodlar);

    const yeniUrun = {
      id: Date.now().toString(),
      ad,
      barkod: otomatikBarkod,
      kategori,
      miktar: Number(girilenMiktar.toFixed(2)),
      birim: varsayilanBirim,
      olusturmaTarihi: simdi,
      guncellemeTarihi: simdi,
      hareketler: [
        {
          tur: 'urun-ekleme',
          miktar: girilenMiktar,
          oncekiMiktar: 0,
          yeniMiktar: Number(girilenMiktar.toFixed(2)),
          aciklama: 'Yeni ürün girişi',
          tarih: simdi
        }
      ]
    };

    database.urunler.push(yeniUrun);
    writeUrunler(database);

    appendHareket({
      tur: 'urun-ekleme',
      miktar: girilenMiktar,
      oncekiMiktar: 0,
      yeniMiktar: Number(girilenMiktar.toFixed(2)),
      aciklama: 'Yeni ürün girişi',
      tarih: simdi,
      urunId: yeniUrun.id,
      barkod: yeniUrun.barkod,
      ad: yeniUrun.ad,
      kategori: yeniUrun.kategori,
      birim: yeniUrun.birim,
      kaynak: 'urun-ekle'
    });

    return NextResponse.json(
      {
        mesaj: 'Ürün başarıyla eklendi',
        urun: yeniUrun,
        guncellendi: false
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Ürün ekleme hatası:', error);
    return NextResponse.json(
      { hata: 'Ürün eklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
