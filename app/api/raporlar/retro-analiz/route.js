import { NextResponse } from 'next/server';
import { buildRetroAnalysisReport } from '@/lib/reports/retroAnalysis';

export const runtime = 'nodejs';

const isValidDateString = (value) => {
  if (!value) {
    return false;
  }
  const parsed = new Date(value).getTime();
  return !Number.isNaN(parsed);
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    const startDate = isValidDateString(startParam) ? startParam : undefined;
    const endDate = isValidDateString(endParam) ? endParam : undefined;

    const rapor = buildRetroAnalysisReport({ startDate, endDate });

    return NextResponse.json({ rapor }, { status: 200 });
  } catch (error) {
    console.error('Retro analiz raporu oluşturulamadı:', error);
    return NextResponse.json(
      { hata: 'Retro analiz raporu hazırlanırken bir hata oluştu' },
      { status: 500 }
    );
  }
}
