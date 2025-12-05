import { NextResponse } from 'next/server';
import { buildLocationProductBreakdownReport } from '@/lib/reports/locationProductBreakdown';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const rapor = buildLocationProductBreakdownReport(['bar', 'mutfak']);
    return NextResponse.json({ rapor }, { status: 200 });
  } catch (error) {
    console.error('Konum ürün dağılımı raporu oluşturulamadı:', error);
    return NextResponse.json(
      { hata: 'Konum ürün dağılımı raporu hazırlanırken bir hata oluştu' },
      { status: 500 }
    );
  }
}
