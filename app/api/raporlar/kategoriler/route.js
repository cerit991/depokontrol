import { NextResponse } from 'next/server';
import { buildCategoryTotalsReport } from '@/lib/reports/categoryTotals';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const rapor = buildCategoryTotalsReport();
    return NextResponse.json({ rapor }, { status: 200 });
  } catch (error) {
    console.error('Kategori bazlı rapor oluşturulamadı:', error);
    return NextResponse.json(
      { hata: 'Kategori bazlı rapor hazırlanırken bir hata oluştu' },
      { status: 500 }
    );
  }
}
