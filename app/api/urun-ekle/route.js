import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Veritabanı dosyası yolu
const dbPath = path.join(process.cwd(), 'data', 'urunler.json');

// Data klasörünü ve dosyayı oluştur
function initializeDatabase() {
  const dataDir = path.join(process.cwd(), 'data');
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ urunler: [] }, null, 2));
  }
}

// Ürünleri oku
function readUrunler() {
  initializeDatabase();
  const data = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(data);
}

// Ürünleri yaz
function writeUrunler(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

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
    
    // Validasyon
    if (!body.ad || !body.kategori || !body.miktar) {
      return NextResponse.json(
        { hata: 'Gerekli alanlar eksik' },
        { status: 400 }
      );
    }

    // Mevcut ürünleri oku
    const database = readUrunler();
    const mevcutBarkodlar = new Set(database.urunler.map(urun => urun.barkod).filter(Boolean));
    const otomatikBarkod = generateBarcode(mevcutBarkodlar);
    
    // Yeni ürün oluştur
    const yeniUrun = {
      id: Date.now().toString(),
      ad: body.ad,
      barkod: otomatikBarkod,
      kategori: body.kategori,
      miktar: parseFloat(body.miktar),
      birim: body.birim || 'adet',
      olusturmaTarihi: new Date().toISOString(),
      guncellemeTarihi: new Date().toISOString()
    };

    // Ürünü ekle
    database.urunler.push(yeniUrun);
    
    // Veritabanına yaz
    writeUrunler(database);

    return NextResponse.json(
      { 
        mesaj: 'Ürün başarıyla eklendi',
        urun: yeniUrun 
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
