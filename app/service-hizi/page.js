'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';

const numberFormatter = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

const daysFormatter = (value) =>
  value === null || value === undefined
    ? '-'
    : numberFormatter.format(Number(value || 0));

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

const formatDate = (value) => {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return dateFormatter.format(date);
};

const LocationIntervalTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) {
    return null;
  }

  const dataPoint = payload[0]?.payload;
  if (!dataPoint) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-md text-sm text-gray-700">
      <p className="font-semibold text-gray-900">{label}</p>
      <p>Ortalama yenileme: {daysFormatter(dataPoint.avgInterval)} gün</p>
      <p>Transfer sayısı: {numberFormatter.format(dataPoint.totalTransfers)}</p>
      <p>Ürün çeşidi: {numberFormatter.format(dataPoint.distinctProductCount)}</p>
    </div>
  );
};

const ProductIntervalTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) {
    return null;
  }

  const dataPoint = payload[0]?.payload;
  if (!dataPoint) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-md text-sm text-gray-700">
      <p className="font-semibold text-gray-900">{label}</p>
      <p>Konum: {dataPoint.location}</p>
      <p>Ortalama yenileme: {daysFormatter(dataPoint.avgInterval)} gün</p>
      {dataPoint.lastInterval !== null && (
        <p>Son yenileme: {daysFormatter(dataPoint.lastInterval)} gün</p>
      )}
      <p>Transfer sayısı: {numberFormatter.format(dataPoint.transferCount)}</p>
    </div>
  );
};

export default function ServiceSpeedPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/raporlar/service-hizi');
        const body = await response.json();

        if (!response.ok) {
          throw new Error(body?.hata || 'Servis hızı raporu alınamadı');
        }

        setData(body?.rapor || null);
      } catch (err) {
        console.error('Servis hızı raporu yüklenemedi:', err);
        setError(err.message || 'Servis hızı raporu yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  const locationChartData = useMemo(() => {
    if (!data?.locations?.length) {
      return [];
    }

    return data.locations
      .filter((entry) => entry.averageIntervalDays !== null)
      .map((entry) => ({
        location: entry.location,
        avgInterval: entry.averageIntervalDays,
        totalTransfers: entry.totalTransfers,
        distinctProductCount: entry.distinctProductCount
      }));
  }, [data]);

  const fastestProductsChart = useMemo(() => {
    if (!data?.fastestProducts?.length) {
      return [];
    }

    return data.fastestProducts.map((entry) => ({
      name: entry.name,
      location: entry.location,
      avgInterval: entry.averageIntervalDays,
      lastInterval: entry.lastIntervalDays,
      transferCount: entry.transferCount
    }));
  }, [data]);

  const slowestProductsChart = useMemo(() => {
    if (!data?.slowestProducts?.length) {
      return [];
    }

    return data.slowestProducts.map((entry) => ({
      name: entry.name,
      location: entry.location,
      avgInterval: entry.averageIntervalDays,
      lastInterval: entry.lastIntervalDays,
      transferCount: entry.transferCount
    }));
  }, [data]);

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
            <h1 className="text-3xl font-bold text-gray-800">Servis Hızı Paneli</h1>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center text-gray-600">
            Servis hızı raporu hazırlanıyor...
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6">
            {error}
          </div>
        ) : !data ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center text-gray-600">
            Servis hızı raporu bulunamadı.
          </div>
        ) : (
          <div className="space-y-8">
            <section className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Konum Bazlı Yenileme Süreleri</h2>
              </div>
              {data.locations.length === 0 ? (
                <p className="text-gray-600 text-sm">Konum bazlı servis hızı verisi bulunamadı.</p>
              ) : (
                <div className="space-y-6">
                  {locationChartData.length > 0 ? (
                    <div className="w-full h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={locationChartData} margin={{ top: 8, right: 16, left: 0, bottom: 16 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="location" tick={{ fill: '#4b5563' }} stroke="#9ca3af" />
                          <YAxis tick={{ fill: '#4b5563' }} stroke="#9ca3af" tickFormatter={daysFormatter} />
                          <Legend verticalAlign="top" height={24} wrapperStyle={{ paddingBottom: 12 }} />
                          <RechartsTooltip content={<LocationIntervalTooltip />} />
                          <Bar dataKey="avgInterval" name="Ortalama Yenileme (Gün)" radius={[6, 6, 0, 0]} fill="#22d3ee" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">Ortalama yenileme süresi hesaplanabilecek konum bulunamadı.</p>
                  )}

                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm text-gray-800">
                      <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-600">
                        <tr>
                          <th className="border-b border-gray-200 px-4 py-3 text-left">Konum</th>
                          <th className="border-b border-gray-200 px-4 py-3 text-right">Ortalama Yenileme (Gün)</th>
                          <th className="border-b border-gray-200 px-4 py-3 text-right">Transfer Sayısı</th>
                          <th className="border-b border-gray-200 px-4 py-3 text-right">Ürün Çeşidi</th>
                          <th className="border-b border-gray-200 px-4 py-3 text-left">Son Transfer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.locations.map((entry, index) => (
                          <tr key={entry.location} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                            <td className="border-b border-gray-200 px-4 py-3 font-semibold text-gray-900">
                              {entry.location}
                            </td>
                            <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-700">
                              {entry.averageIntervalDays === null
                                ? '-'
                                : `${daysFormatter(entry.averageIntervalDays)} gün`}
                            </td>
                            <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-700">
                              {numberFormatter.format(entry.totalTransfers)}
                            </td>
                            <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-700">
                              {numberFormatter.format(entry.distinctProductCount)}
                            </td>
                            <td className="border-b border-gray-200 px-4 py-3 text-gray-700">
                              {formatDate(entry.lastTransferDate)}
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-xl font-semibold text-gray-800">En Hızlı Tükenen Ürünler</h2>
              </div>
              {data.fastestProducts.length === 0 ? (
                <p className="text-gray-600 text-sm">Yenileme süresi hesaplanabilen ürün bulunamadı.</p>
              ) : (
                <div className="space-y-6">
                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={fastestProductsChart}
                        layout="vertical"
                        margin={{ top: 8, right: 24, left: 120, bottom: 16 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" tickFormatter={daysFormatter} tick={{ fill: '#4b5563' }} stroke="#9ca3af" />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tick={{ fill: '#4b5563' }}
                          width={240}
                        />
                        <Legend verticalAlign="top" height={24} wrapperStyle={{ paddingBottom: 12 }} />
                        <RechartsTooltip content={<ProductIntervalTooltip />} />
                        <Bar dataKey="avgInterval" name="Ortalama Yenileme (Gün)" fill="#34d399" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm text-gray-800">
                      <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-600">
                        <tr>
                          <th className="border-b border-gray-200 px-4 py-3 text-left">Ürün</th>
                          <th className="border-b border-gray-200 px-4 py-3 text-left">Konum</th>
                          <th className="border-b border-gray-200 px-4 py-3 text-right">Ortalama Yenileme</th>
                          <th className="border-b border-gray-200 px-4 py-3 text-right">Son Yenileme</th>
                          <th className="border-b border-gray-200 px-4 py-3 text-right">Transfer Sayısı</th>
                          <th className="border-b border-gray-200 px-4 py-3 text-left">Son Transfer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.fastestProducts.map((entry, index) => (
                          <tr key={`${entry.location}-${entry.productId || entry.name}`} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                            <td className="border-b border-gray-200 px-4 py-3 font-semibold text-gray-900">
                              {entry.name}
                            </td>
                            <td className="border-b border-gray-200 px-4 py-3 text-gray-700">
                              {entry.location}
                            </td>
                            <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-700">
                              {daysFormatter(entry.averageIntervalDays)} gün
                            </td>
                            <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-700">
                              {entry.lastIntervalDays === null
                                ? '-'
                                : `${daysFormatter(entry.lastIntervalDays)} gün`}
                            </td>
                            <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-700">
                              {numberFormatter.format(entry.transferCount)}
                            </td>
                            <td className="border-b border-gray-200 px-4 py-3 text-gray-700">
                              {formatDate(entry.lastTransferDate)}
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-xl font-semibold text-gray-800">En Yavaş Tükenen Ürünler</h2>
              </div>
              {data.slowestProducts.length === 0 ? (
                <p className="text-gray-600 text-sm">Yenileme süresi hesaplanabilen ürün bulunamadı.</p>
              ) : (
                <div className="space-y-6">
                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={slowestProductsChart}
                        layout="vertical"
                        margin={{ top: 8, right: 24, left: 120, bottom: 16 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" tickFormatter={daysFormatter} tick={{ fill: '#4b5563' }} stroke="#9ca3af" />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tick={{ fill: '#4b5563' }}
                          width={240}
                        />
                        <Legend verticalAlign="top" height={24} wrapperStyle={{ paddingBottom: 12 }} />
                        <RechartsTooltip content={<ProductIntervalTooltip />} />
                        <Bar dataKey="avgInterval" name="Ortalama Yenileme (Gün)" fill="#f97316" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm text-gray-800">
                      <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-600">
                        <tr>
                          <th className="border-b border-gray-200 px-4 py-3 text-left">Ürün</th>
                          <th className="border-b border-gray-200 px-4 py-3 text-left">Konum</th>
                          <th className="border-b border-gray-200 px-4 py-3 text-right">Ortalama Yenileme</th>
                          <th className="border-b border-gray-200 px-4 py-3 text-right">Son Yenileme</th>
                          <th className="border-b border-gray-200 px-4 py-3 text-right">Transfer Sayısı</th>
                          <th className="border-b border-gray-200 px-4 py-3 text-left">Son Transfer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.slowestProducts.map((entry, index) => (
                          <tr key={`${entry.location}-${entry.productId || entry.name}`} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                            <td className="border-b border-gray-200 px-4 py-3 font-semibold text-gray-900">
                              {entry.name}
                            </td>
                            <td className="border-b border-gray-200 px-4 py-3 text-gray-700">
                              {entry.location}
                            </td>
                            <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-700">
                              {daysFormatter(entry.averageIntervalDays)} gün
                            </td>
                            <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-700">
                              {entry.lastIntervalDays === null
                                ? '-'
                                : `${daysFormatter(entry.lastIntervalDays)} gün`}
                            </td>
                            <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-700">
                              {numberFormatter.format(entry.transferCount)}
                            </td>
                            <td className="border-b border-gray-200 px-4 py-3 text-gray-700">
                              {formatDate(entry.lastTransferDate)}
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Tek Transferi Olan Ürünler</h2>
              </div>
              {data.singleTransferProducts.length === 0 ? (
                <p className="text-gray-600 text-sm">
                  Tek transfer kaydı bulunan ürün bulunamadı.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm text-gray-800">
                    <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-600">
                      <tr>
                        <th className="border-b border-gray-200 px-4 py-3 text-left">Ürün</th>
                        <th className="border-b border-gray-200 px-4 py-3 text-left">Konum</th>
                        <th className="border-b border-gray-200 px-4 py-3 text-right">Toplam Miktar</th>
                        <th className="border-b border-gray-200 px-4 py-3 text-left">Transfer Tarihi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.singleTransferProducts.map((entry, index) => (
                        <tr key={`${entry.location}-${entry.productId || entry.name}`} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                          <td className="border-b border-gray-200 px-4 py-3 font-semibold text-gray-900">
                            {entry.name}
                          </td>
                          <td className="border-b border-gray-200 px-4 py-3 text-gray-700">
                            {entry.location}
                          </td>
                          <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-700">
                            {numberFormatter.format(entry.totalQuantity)}
                          </td>
                          <td className="border-b border-gray-200 px-4 py-3 text-gray-700">
                            {formatDate(entry.lastTransferDate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
