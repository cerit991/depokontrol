import { NextResponse } from 'next/server';
import { buildLocationTotalsReport } from '@/lib/reports/locationTotals';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const rapor = buildLocationTotalsReport();
    return NextResponse.json({ rapor }, { status: 200 });
  } catch (error) {
    console.error('Konum bazlı rapor oluşturulamadı:', error);
    return NextResponse.json(
      { hata: 'Konum bazlı rapor hazırlanırken bir hata oluştu' },
      { status: 500 }
    );
  }
}
