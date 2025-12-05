import { NextResponse } from 'next/server';
import { buildOverviewReport } from '@/lib/reports/overview';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const rapor = buildOverviewReport();
    return NextResponse.json({ rapor }, { status: 200 });
  } catch (error) {
    console.error('Genel rapor oluşturulamadı:', error);
    return NextResponse.json(
      { hata: 'Genel rapor hazırlanırken bir hata oluştu' },
      { status: 500 }
    );
  }
}
