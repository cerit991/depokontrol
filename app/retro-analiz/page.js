'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  BarChart,
  Bar
} from 'recharts';

const numberFormatter = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

const formatQuantity = (value) => numberFormatter.format(Number(value || 0));

const dateTimeFormatter = new Intl.DateTimeFormat('tr-TR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

const formatDateTime = (value) => {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return dateTimeFormatter.format(date);
};

const daysFormatter = (value) =>
  value === null || value === undefined
    ? '-'
    : numberFormatter.format(Number(value || 0));

const buildDefaultDateRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 14);
  const toInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  return { start: toInput(start), end: toInput(end) };
};

const TimelineTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;
  if (!point) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-md text-sm text-gray-700">
      <p className="font-semibold text-gray-900">{label}</p>
      <p>Transfer sayısı: {formatQuantity(point.transferCount)}</p>
      <p>Toplam miktar: {formatQuantity(point.totalQuantity)}</p>
      <p>Ürün çeşidi: {formatQuantity(point.distinctProductCount)}</p>
    </div>
  );
};

const LocationTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;
  if (!point) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-md text-sm text-gray-700">
      <p className="font-semibold text-gray-900">{label}</p>
      <p>Toplam miktar: {formatQuantity(point.totalQuantity)}</p>
      <p>Transfer sayısı: {formatQuantity(point.transferCount)}</p>
    </div>
  );
};

const ProductTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;
  if (!point) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-md text-sm text-gray-700">
      <p className="font-semibold text-gray-900">{label}</p>
      <p>Konum: {point.location}</p>
      <p>Kategori: {point.category}</p>
      <p>Toplam miktar: {formatQuantity(point.totalQuantity)}</p>
      <p>Transfer sayısı: {formatQuantity(point.transferCount)}</p>
    </div>
  );
};

export default function RetroAnalysisPage() {
  const router = useRouter();
  const defaultRange = useMemo(buildDefaultDateRange, []);
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = useCallback(async (rangeStart, rangeEnd) => {
    if (rangeStart && rangeEnd) {
      const startTime = new Date(rangeStart).getTime();
      const endTime = new Date(rangeEnd).getTime();
      if (!Number.isNaN(startTime) && !Number.isNaN(endTime) && startTime > endTime) {
        setError('Başlangıç tarihi bitiş tarihinden büyük olamaz.');
        setData(null);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (rangeStart) {
        params.set('start', rangeStart);
      }
      if (rangeEnd) {
        params.set('end', rangeEnd);
      }

      const response = await fetch(`/api/raporlar/retro-analiz?${params.toString()}`);
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.hata || 'Retro analiz raporu alınamadı');
      }

      setData(body?.rapor || null);
    } catch (err) {
      console.error('Retro analiz raporu yüklenemedi:', err);
      setError(err.message || 'Retro analiz raporu yüklenirken bir hata oluştu');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(startDate, endDate);
  }, [startDate, endDate, fetchReport]);

  const summaryCards = useMemo(() => {
    if (!data?.summary) {
      return [];
    }
    return [
      {
        label: 'Transfer Sayısı',
        value: formatQuantity(data.summary.totalTransfers),
        bg: 'bg-blue-50',
        border: 'border-blue-100',
        text: 'text-blue-900',
        labelColor: 'text-blue-700'
      },
      {
        label: 'Toplam Teslimat Miktarı',
        value: formatQuantity(data.summary.totalQuantity),
        bg: 'bg-purple-50',
        border: 'border-purple-100',
        text: 'text-purple-900',
        labelColor: 'text-purple-700'
      },
      {
        label: 'Ürün Çeşidi',
        value: formatQuantity(data.summary.distinctProductCount),
        bg: 'bg-emerald-50',
        border: 'border-emerald-100',
        text: 'text-emerald-900',
        labelColor: 'text-emerald-700'
      },
      {
        label: 'Aktif Konum',
        value: formatQuantity(data.summary.distinctLocationCount),
        bg: 'bg-amber-50',
        border: 'border-amber-100',
        text: 'text-amber-900',
        labelColor: 'text-amber-700'
      }
    ];
  }, [data]);

  const timelineChartData = useMemo(() => data?.timeline || [], [data]);
  const topLocationChartData = useMemo(() => data?.topLocations || [], [data]);
  const topProductChartData = useMemo(() => data?.topProducts || [], [data]);
  const events = useMemo(() => data?.events || [], [data]);

  const resetRange = () => {
    setStartDate(defaultRange.start);
    setEndDate(defaultRange.end);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Geri
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Retro Analiz</h1>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="startDate" className="text-sm font-semibold text-gray-700">
                Başlangıç
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="endDate" className="text-sm font-semibold text-gray-700">
                Bitiş
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={resetRange}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-semibold"
            >
              Varsayılana Dön
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center text-gray-600">
            Retro analiz raporu hazırlanıyor...
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6">
            {error}
          </div>
        ) : !data ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center text-gray-600">
            Retro analiz raporu bulunamadı.
          </div>
        ) : (
          <div className="space-y-8">
            <section className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Genel Bakış</h2>
              {summaryCards.length === 0 ? (
                <p className="text-gray-600 text-sm">Özet verisi bulunamadı.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {summaryCards.map((card) => (
                    <div
                      key={card.label}
                      className={`${card.bg} ${card.border} border rounded-lg p-4`}
                    >
                      <p className={`text-sm font-semibold ${card.labelColor}`}>{card.label}</p>
                      <p className={`text-2xl font-bold mt-2 ${card.text}`}>{card.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Günlük Transfer Akışı</h2>
              {timelineChartData.length === 0 ? (
                <p className="text-gray-600 text-sm">Zaman çizelgesi verisi bulunamadı.</p>
              ) : (
                <div className="space-y-6">
                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={timelineChartData} margin={{ top: 8, right: 24, left: 0, bottom: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fill: '#4b5563' }} stroke="#9ca3af" />
                        <YAxis yAxisId="left" tick={{ fill: '#4b5563' }} stroke="#9ca3af" tickFormatter={formatQuantity} />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fill: '#4b5563' }}
                          stroke="#9ca3af"
                          tickFormatter={formatQuantity}
                        />
                        <Legend verticalAlign="top" height={24} wrapperStyle={{ paddingBottom: 12 }} />
                        <RechartsTooltip content={<TimelineTooltip />} />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="totalQuantity"
                          name="Toplam Miktar"
                          fill="#7c3aed33"
                          stroke="#7c3aed"
                          strokeWidth={2}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="transferCount"
                          name="Transfer Sayısı"
                          stroke="#2563eb"
                          strokeWidth={2}
                          dot={false}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm text-gray-800">
                      <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-600">
                        <tr>
                          <th className="border-b border-gray-200 px-4 py-3 text-left">Tarih</th>
                          <th className="border-b border-gray-200 px-4 py-3 text-right">Transfer Sayısı</th>
                          <th className="border-b border-gray-200 px-4 py-3 text-right">Toplam Miktar</th>
                          <th className="border-b border-gray-200 px-4 py-3 text-right">Ürün Çeşidi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timelineChartData.map((entry, index) => (
                          <tr key={entry.date} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                            <td className="border-b border-gray-200 px-4 py-3 font-semibold text-gray-900">
                              {entry.date}
                            </td>
                            <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-700">
                              {formatQuantity(entry.transferCount)}
                            </td>
                            <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-700">
                              {formatQuantity(entry.totalQuantity)}
                            </td>
                            <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-700">
                              {formatQuantity(entry.distinctProductCount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

            <section className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Konum ve Ürün Kırılımları</h2>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Konumlar</h3>
                  {topLocationChartData.length === 0 ? (
                    <p className="text-gray-600 text-sm">Konum verisi bulunamadı.</p>
                  ) : (
                    <>
                      <div className="w-full h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={topLocationChartData}
                            layout="vertical"
                            margin={{ top: 8, right: 24, left: 120, bottom: 16 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis type="number" tickFormatter={formatQuantity} tick={{ fill: '#4b5563' }} stroke="#9ca3af" />
                            <YAxis dataKey="location" type="category" tick={{ fill: '#4b5563' }} width={200} />
                            <Legend verticalAlign="top" height={24} wrapperStyle={{ paddingBottom: 12 }} />
                            <RechartsTooltip content={<LocationTooltip />} />
                            <Bar dataKey="totalQuantity" name="Toplam Miktar" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm text-gray-800">
                          <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-600">
                            <tr>
                              <th className="border-b border-gray-200 px-4 py-3 text-left">Konum</th>
                              <th className="border-b border-gray-200 px-4 py-3 text-right">Toplam Miktar</th>
                              <th className="border-b border-gray-200 px-4 py-3 text-right">Transfer Sayısı</th>
                            </tr>
                          </thead>
                          <tbody>
                            {topLocationChartData.map((entry, index) => (
                              <tr key={entry.location} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                                <td className="border-b border-gray-200 px-4 py-3 font-semibold text-gray-900">
                                  {entry.location}
                                </td>
                                <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-700">
                                  {formatQuantity(entry.totalQuantity)}
                                </td>
                                <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-700">
                                  {formatQuantity(entry.transferCount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Ürünler</h3>
                  {topProductChartData.length === 0 ? (
                    <p className="text-gray-600 text-sm">Ürün verisi bulunamadı.</p>
                  ) : (
                    <>
                      <div className="w-full h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={topProductChartData}
                            layout="vertical"
                            margin={{ top: 8, right: 24, left: 140, bottom: 16 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis type="number" tickFormatter={formatQuantity} tick={{ fill: '#4b5563' }} stroke="#9ca3af" />
                            <YAxis dataKey="name" type="category" tick={{ fill: '#4b5563' }} width={260} />
                            <Legend verticalAlign="top" height={24} wrapperStyle={{ paddingBottom: 12 }} />
                            <RechartsTooltip content={<ProductTooltip />} />
                            <Bar dataKey="totalQuantity" name="Toplam Miktar" fill="#f97316" radius={[0, 6, 6, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm text-gray-800">
                          <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-600">
                            <tr>
                              <th className="border-b border-gray-200 px-4 py-3 text-left">Ürün</th>
                              <th className="border-b border-gray-200 px-4 py-3 text-left">Konum</th>
                              <th className="border-b border-gray-200 px-4 py-3 text-right">Toplam Miktar</th>
                              <th className="border-b border-gray-200 px-4 py-3 text-right">Transfer Sayısı</th>
                            </tr>
                          </thead>
                          <tbody>
                            {topProductChartData.map((entry, index) => (
                              <tr key={`${entry.location}-${entry.productId || entry.name}`} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                                <td className="border-b border-gray-200 px-4 py-3 font-semibold text-gray-900">
                                  {entry.name}
                                </td>
                                <td className="border-b border-gray-200 px-4 py-3 text-gray-700">
                                  {entry.location}
                                </td>
                                <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-700">
                                  {formatQuantity(entry.totalQuantity)}
                                </td>
                                <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-700">
                                  {formatQuantity(entry.transferCount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>

            <section className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Transfer Zaman Çizelgesi</h2>
              {events.length === 0 ? (
                <p className="text-gray-600 text-sm">Seçili aralıkta transfer bulunamadı.</p>
              ) : (
                <div className="space-y-4">
                  <div className="max-h-96 overflow-y-auto pr-2">
                    <ul className="space-y-3">
                      {events.map((event) => (
                        <li key={`${event.id}-${event.timestamp}`} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                            <div>
                              <p className="text-sm text-gray-500 font-semibold">{formatDateTime(event.timestamp)}</p>
                              <p className="text-lg font-bold text-gray-900 mt-1">{event.location}</p>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                              <span>Ürün satırı: {formatQuantity(event.productCount)}</span>
                              <span>Toplam miktar: {formatQuantity(event.totalQuantity)}</span>
                              <span>Teslim eden: {event.teslimEden}</span>
                              <span>Teslim alan: {event.teslimAlan}</span>
                            </div>
                          </div>
                          {event.aciklama && (
                            <p className="mt-3 text-sm text-gray-600">Not: {event.aciklama}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
