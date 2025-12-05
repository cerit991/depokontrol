import { NextResponse } from 'next/server';
import { buildServiceSpeedReport } from '@/lib/reports/serviceSpeed';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const rapor = buildServiceSpeedReport();
    return NextResponse.json({ rapor }, { status: 200 });
  } catch (error) {
    console.error('Servis hızı raporu oluşturulamadı:', error);
    return NextResponse.json(
      { hata: 'Servis hızı raporu hazırlanırken bir hata oluştu' },
      { status: 500 }
    );
  }
}
