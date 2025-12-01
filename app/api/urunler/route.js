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

export async function GET(request) {
  try {
    // Ürünleri oku
    const database = readUrunler();

    return NextResponse.json(
      { 
        urunler: database.urunler,
        toplam: database.urunler.length
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Ürünler yükleme hatası:', error);
    return NextResponse.json(
      { 
        hata: 'Ürünler yüklenirken bir hata oluştu',
        urunler: []
      },
      { status: 500 }
    );
  }
}
