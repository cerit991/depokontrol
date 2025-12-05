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
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const numberFormatter = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

const formatQuantity = (value) => numberFormatter.format(Number(value || 0));

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

const chartColors = ['#2563eb', '#7c3aed', '#0ea5e9', '#14b8a6', '#f97316', '#ef4444', '#10b981'];

const LocationTooltip = ({ active, payload, label }) => {
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
      <p>Toplam miktar: {formatQuantity(dataPoint.totalQuantity)}</p>
      <p>Transfer sayısı: {formatQuantity(dataPoint.transferCount)}</p>
      <p>Ürün çeşidi: {formatQuantity(dataPoint.distinctProductCount)}</p>
    </div>
  );
};

const CategoryTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) {
    return null;
  }

  const dataPoint = payload[0]?.payload;
  if (!dataPoint) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-md text-sm text-gray-700">
      <p className="font-semibold text-gray-900">{dataPoint.category}</p>
      <p>Toplam miktar: {formatQuantity(dataPoint.totalQuantity)}</p>
      <p>Satır sayısı: {formatQuantity(dataPoint.lineCount)}</p>
    </div>
  );
};

const TopProductsTooltip = ({ active, payload, label }) => {
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
      <p>Kategori: {dataPoint.category}</p>
      <p>Toplam miktar: {formatQuantity(dataPoint.totalQuantity)}</p>
    </div>
  );
};

const LocationProductTooltip = ({ active, payload, label }) => {
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
      <p>Kategori: {dataPoint.category}</p>
      <p>Toplam miktar: {formatQuantity(dataPoint.totalQuantity)}</p>
    </div>
  );
};

export default function ReportsPage() {
  const router = useRouter();
  const [overview, setOverview] = useState(null);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [locationProducts, setLocationProducts] = useState([]);
  const [locationSearch, setLocationSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const locationChartData = useMemo(
    () =>
      locations.map((item) => ({
        location: item.location,
        totalQuantity: item.totalQuantity,
        transferCount: item.transferCount,
        distinctProductCount: item.distinctProductCount
      })),
    [locations]
  );

  const categoryChartData = useMemo(
    () =>
      categories.map((item) => ({
        category: item.category,
        totalQuantity: item.totalQuantity,
        lineCount: item.lineCount
      })),
    [categories]
  );

  const topProductChartData = useMemo(
    () =>
      topProducts.map((item) => ({
        productId: item.productId,
        name: item.name,
        category: item.category,
        totalQuantity: item.totalQuantity
      })),
    [topProducts]
  );

  const locationProductMap = useMemo(() => {
    const map = new Map();
    locationProducts.forEach((entry) => {
      const key = entry?.location ? String(entry.location).trim().toLowerCase() : '';
      if (!key) {
        return;
      }

      map.set(key, {
        location: entry.location,
        totalQuantity: entry.totalQuantity,
        products: Array.isArray(entry.products)
          ? entry.products.map((product) => ({
              ...product,
              totalQuantity: Number(product.totalQuantity || 0)
            }))
          : []
      });
    });
    return map;
  }, [locationProducts]);

  const barProductSummary = locationProductMap.get('bar');
  const kitchenProductSummary = locationProductMap.get('mutfak');
  const normalizedSearch = locationSearch.trim().toLocaleLowerCase('tr-TR');

  const filteredBarProducts = useMemo(() => {
    if (!barProductSummary) {
      return [];
    }

    if (!normalizedSearch) {
      return barProductSummary.products;
    }

    return barProductSummary.products.filter((product) => {
      const nameMatch = product.name
        ?.toLocaleLowerCase('tr-TR')
        .includes(normalizedSearch);
      const categoryMatch = product.category
        ?.toLocaleLowerCase('tr-TR')
        .includes(normalizedSearch);
      return nameMatch || categoryMatch;
    });
  }, [barProductSummary, normalizedSearch]);

  const filteredKitchenProducts = useMemo(() => {
    if (!kitchenProductSummary) {
      return [];
    }

    if (!normalizedSearch) {
      return kitchenProductSummary.products;
    }

    return kitchenProductSummary.products.filter((product) => {
      const nameMatch = product.name
        ?.toLocaleLowerCase('tr-TR')
        .includes(normalizedSearch);
      const categoryMatch = product.category
        ?.toLocaleLowerCase('tr-TR')
        .includes(normalizedSearch);
      return nameMatch || categoryMatch;
    });
  }, [kitchenProductSummary, normalizedSearch]);

  const barChartData = useMemo(
    () => filteredBarProducts.slice(0, 10),
    [filteredBarProducts]
  );
  const kitchenChartData = useMemo(
    () => filteredKitchenProducts.slice(0, 10),
    [filteredKitchenProducts]
  );

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError('');

      try {
        const [
          overviewRes,
          locationRes,
          categoryRes,
          topProductsRes,
          locationProductsRes
        ] = await Promise.all([
          fetch('/api/raporlar/genel'),
          fetch('/api/raporlar/konumlar'),
          fetch('/api/raporlar/kategoriler'),
          fetch('/api/raporlar/en-cok-gonderilenler?limit=5'),
          fetch('/api/raporlar/konum-urunleri')
        ]);

        const responses = [
          overviewRes,
          locationRes,
          categoryRes,
          topProductsRes,
          locationProductsRes
        ];
        const hasError = responses.find((response) => !response.ok);

        if (hasError) {
          const errorBody = await hasError.json().catch(() => ({}));
          throw new Error(errorBody?.hata || 'Rapor verileri alınamadı');
        }

        const [
          overviewBody,
          locationBody,
          categoryBody,
          topProductsBody,
          locationProductsBody
        ] = await Promise.all(
          responses.map((response) => response.json())
        );

        setOverview(overviewBody?.rapor || null);
        setLocations(Array.isArray(locationBody?.rapor?.locations) ? locationBody.rapor.locations : []);
        setCategories(Array.isArray(categoryBody?.rapor?.categories) ? categoryBody.rapor.categories : []);
        setTopProducts(Array.isArray(topProductsBody?.rapor?.products) ? topProductsBody.rapor.products : []);
        setLocationProducts(
          Array.isArray(locationProductsBody?.rapor?.locations)
            ? locationProductsBody.rapor.locations
            : []
        );
      } catch (err) {
        console.error('Raporlar yüklenemedi:', err);
        setError(err.message || 'Raporlar yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

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
            <h1 className="text-3xl font-bold text-gray-800">Raporlar</h1>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center text-gray-600">
            Raporlar hazırlanıyor...
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6">
            {error}
          </div>
        ) : (
          <div className="space-y-8">
            {overview && (
              <section className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Genel Bakış</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <p className="text-sm text-blue-700 font-semibold">Toplam Transfer</p>
                    <p className="text-2xl font-bold text-blue-900 mt-2">{formatQuantity(overview.totalTransfers)}</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                    <p className="text-sm text-purple-700 font-semibold">Teslim Edilen Ürün Miktarı</p>
                    <p className="text-2xl font-bold text-purple-900 mt-2">{formatQuantity(overview.totalItemsDelivered)}</p>
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                    <p className="text-sm text-green-700 font-semibold">Bar&apos;a Teslimat</p>
                    <p className="text-2xl font-bold text-green-900 mt-2">{formatQuantity(overview.deliveredToBar)}</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                    <p className="text-sm text-amber-700 font-semibold">Ürün Çeşidi</p>
                    <p className="text-2xl font-bold text-amber-900 mt-2">{formatQuantity(overview.distinctProductCount)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-sm text-gray-600">
                  <div>
                    <span className="font-semibold text-gray-700">Transfer Başına Ortalama:</span>{' '}
                    {formatQuantity(overview.averageItemsPerTransfer)}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">İlk Transfer:</span>{' '}
                    {formatDate(overview.firstTransferDate)}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Son Transfer:</span>{' '}
                    {formatDate(overview.lastTransferDate)}
                  </div>
                </div>
              </section>
            )}

            <section className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Konuma Göre Teslimatlar</h2>
              </div>
              {locations.length === 0 ? (
                <p className="text-gray-600 text-sm">Konum bazlı teslimat kaydı bulunamadı.</p>
              ) : (
                <div className="space-y-6">
                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={locationChartData} margin={{ top: 8, right: 16, left: 0, bottom: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="location" tick={{ fill: '#4b5563' }} stroke="#9ca3af" interval={0} angle={-10} textAnchor="end" />
                        <YAxis tick={{ fill: '#4b5563' }} stroke="#9ca3af" tickFormatter={formatQuantity} allowDecimals />
                        <RechartsTooltip content={<LocationTooltip />} />
                        <Legend verticalAlign="top" height={24} wrapperStyle={{ paddingBottom: 12 }} />
                        <Bar dataKey="totalQuantity" name="Toplam Miktar" radius={[6, 6, 0, 0]} fill="#2563eb" />
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
                          <th className="border-b border-gray-200 px-4 py-3 text-right">Ürün Çeşidi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {locations.map((item, index) => (
                          <tr key={item.location} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                            <td className="border-b border-gray-200 px-4 py-3 font-semibold text-gray-900">
                              {item.location}
                            </td>
                            <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-700">
                              {formatQuantity(item.totalQuantity)}
                            </td>
                            <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-700">
                              {formatQuantity(item.transferCount)}
                            </td>
                            <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-700">
                              {formatQuantity(item.distinctProductCount)}
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
                <h2 className="text-xl font-semibold text-gray-800">Kategoriye Göre Teslimatlar</h2>
              </div>
              {categories.length === 0 ? (
                <p className="text-gray-600 text-sm">Kategori bazlı teslimat kaydı bulunamadı.</p>
              ) : (
                <div className="space-y-6">
                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          dataKey="totalQuantity"
                          nameKey="category"
                          innerRadius={60}
                          outerRadius={110}
                          paddingAngle={3}
                          blendStroke
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={entry.category} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Pie>
                        <Legend verticalAlign="bottom" height={36} />
                        <RechartsTooltip content={<CategoryTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm text-gray-800">
                      <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-600">
                        <tr>
                          <th className="border-b border-gray-200 px-4 py-3 text-left">Kategori</th>
                          <th className="border-b border-gray-200 px-4 py-3 text-right">Toplam Miktar</th>
                          <th className="border-b border-gray-200 px-4 py-3 text-right">Satır Sayısı</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((item, index) => (
                          <tr key={item.category} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                            <td className="border-b border-gray-200 px-4 py-3 font-semibold text-gray-900">
                              {item.category}
                            </td>
                            <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-700">
                              {formatQuantity(item.totalQuantity)}
                            </td>
                            <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-700">
                              {formatQuantity(item.lineCount)}
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
                <h2 className="text-xl font-semibold text-gray-800">Bar ve Mutfak Ürün Dağılımı</h2>
                <div className="flex items-center gap-3 w-full lg:w-80">
                  <input
                    type="text"
                    value={locationSearch}
                    onChange={(event) => setLocationSearch(event.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ürün veya kategori ara"
                  />
                  {locationSearch && (
                    <button
                      type="button"
                      onClick={() => setLocationSearch('')}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Temizle
                    </button>
                  )}
                </div>
              </div>
              {!barProductSummary && !kitchenProductSummary ? (
                <p className="text-gray-600 text-sm">Bar veya mutfak için kayıtlı teslimat bulunamadı.</p>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {barProductSummary && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">Bar</h3>
                        <p className="text-sm text-gray-600">
                          Toplam teslimat miktarı: {formatQuantity(barProductSummary.totalQuantity)}
                        </p>
                      </div>
                      {barProductSummary.products.length === 0 ? (
                        <p className="text-gray-600 text-sm">Bar için ürün kaydı bulunamadı.</p>
                      ) : filteredBarProducts.length === 0 ? (
                        <p className="text-gray-600 text-sm">
                          Arama kriterine uygun bar ürünü bulunamadı.
                        </p>
                      ) : (
                        <>
                          <div className="w-full h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={barChartData}
                                layout="vertical"
                                margin={{ top: 8, right: 24, left: 80, bottom: 16 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                  type="number"
                                  tickFormatter={formatQuantity}
                                  tick={{ fill: '#4b5563' }}
                                  stroke="#9ca3af"
                                />
                                <YAxis dataKey="name" type="category" tick={{ fill: '#4b5563' }} width={200} />
                                <RechartsTooltip content={<LocationProductTooltip />} />
                                <Legend verticalAlign="top" height={24} wrapperStyle={{ paddingBottom: 12 }} />
                                <Bar dataKey="totalQuantity" name="Toplam Miktar">
                                  {barChartData.map((item, index) => (
                                    <Cell
                                      key={item.productId || `${item.name}-${index}`}
                                      fill={chartColors[index % chartColors.length]}
                                    />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse text-sm text-gray-800">
                              <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-600">
                                <tr>
                                  <th className="border-b border-gray-200 px-4 py-3 text-left">Ürün</th>
                                  <th className="border-b border-gray-200 px-4 py-3 text-left">Kategori</th>
                                  <th className="border-b border-gray-200 px-4 py-3 text-right">Toplam Miktar</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredBarProducts.map((product, index) => (
                                  <tr key={product.productId || `${product.name}-${index}`} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                                    <td className="border-b border-gray-200 px-4 py-3 font-semibold text-gray-900">
                                      {product.name}
                                    </td>
                                    <td className="border-b border-gray-200 px-4 py-3 text-gray-700">
                                      {product.category}
                                    </td>
                                    <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-700">
                                      {formatQuantity(product.totalQuantity)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {kitchenProductSummary && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">Mutfak</h3>
                        <p className="text-sm text-gray-600">
                          Toplam teslimat miktarı: {formatQuantity(kitchenProductSummary.totalQuantity)}
                        </p>
                      </div>
                      {kitchenProductSummary.products.length === 0 ? (
                        <p className="text-gray-600 text-sm">Mutfak için ürün kaydı bulunamadı.</p>
                      ) : filteredKitchenProducts.length === 0 ? (
                        <p className="text-gray-600 text-sm">
                          Arama kriterine uygun mutfak ürünü bulunamadı.
                        </p>
                      ) : (
                        <>
                          <div className="w-full h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={kitchenChartData}
                                layout="vertical"
                                margin={{ top: 8, right: 24, left: 80, bottom: 16 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                  type="number"
                                  tickFormatter={formatQuantity}
                                  tick={{ fill: '#4b5563' }}
                                  stroke="#9ca3af"
                                />
                                <YAxis dataKey="name" type="category" tick={{ fill: '#4b5563' }} width={200} />
                                <RechartsTooltip content={<LocationProductTooltip />} />
                                <Legend verticalAlign="top" height={24} wrapperStyle={{ paddingBottom: 12 }} />
                                <Bar dataKey="totalQuantity" name="Toplam Miktar">
                                  {kitchenChartData.map((item, index) => (
                                    <Cell
                                      key={item.productId || `${item.name}-${index}`}
                                      fill={chartColors[index % chartColors.length]}
                                    />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse text-sm text-gray-800">
                              <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-600">
                                <tr>
                                  <th className="border-b border-gray-200 px-4 py-3 text-left">Ürün</th>
                                  <th className="border-b border-gray-200 px-4 py-3 text-left">Kategori</th>
                                  <th className="border-b border-gray-200 px-4 py-3 text-right">Toplam Miktar</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredKitchenProducts.map((product, index) => (
                                  <tr key={product.productId || `${product.name}-${index}`} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                                    <td className="border-b border-gray-200 px-4 py-3 font-semibold text-gray-900">
                                      {product.name}
                                    </td>
                                    <td className="border-b border-gray-200 px-4 py-3 text-gray-700">
                                      {product.category}
                                    </td>
                                    <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-700">
                                      {formatQuantity(product.totalQuantity)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-xl font-semibold text-gray-800">En Çok Teslim Edilen Ürünler</h2>
              </div>
              {topProducts.length === 0 ? (
                <p className="text-gray-600 text-sm">Ürün bazlı teslimat kaydı bulunamadı.</p>
              ) : (
                <div className="space-y-6">
                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topProductChartData}
                        layout="vertical"
                        margin={{ top: 8, right: 24, left: 80, bottom: 16 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" tickFormatter={formatQuantity} tick={{ fill: '#4b5563' }} stroke="#9ca3af" />
                        <YAxis dataKey="name" type="category" tick={{ fill: '#4b5563' }} width={180} />
                        <RechartsTooltip content={<TopProductsTooltip />} />
                        <Legend verticalAlign="top" height={24} wrapperStyle={{ paddingBottom: 12 }} />
                        <Bar dataKey="totalQuantity" name="Toplam Miktar" fill="#7c3aed" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm text-gray-800">
                      <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-600">
                        <tr>
                          <th className="border-b border-gray-200 px-4 py-3 text-left">Ürün</th>
                          <th className="border-b border-gray-200 px-4 py-3 text-left">Kategori</th>
                          <th className="border-b border-gray-200 px-4 py-3 text-right">Toplam Miktar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProducts.map((item, index) => (
                          <tr key={item.productId} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                            <td className="border-b border-gray-200 px-4 py-3 font-semibold text-gray-900">
                              {item.name}
                            </td>
                            <td className="border-b border-gray-200 px-4 py-3 text-gray-700">
                              {item.category}
                            </td>
                            <td className="border-b border-gray-200 px-4 py-3 text-right text-gray-700">
                              {formatQuantity(item.totalQuantity)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
