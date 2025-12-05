import { NextResponse } from 'next/server';
import { buildTopProductsReport } from '@/lib/reports/topProducts';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = Number(searchParams.get('limit'));
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 5;

    const rapor = buildTopProductsReport(limit);
    return NextResponse.json({ rapor }, { status: 200 });
  } catch (error) {
    console.error('En çok gönderilen ürünler raporu oluşturulamadı:', error);
    return NextResponse.json(
      { hata: 'En çok gönderilen ürünler raporu hazırlanırken bir hata oluştu' },
      { status: 500 }
    );
  }
}
