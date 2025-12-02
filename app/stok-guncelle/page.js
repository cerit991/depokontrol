'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const normalizeText = (value) =>
  (value ?? '')
    .toString()
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

const formatAmount = (value) => {
  if (value === null || value === undefined) {
    return '-';
  }
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) {
    return '-';
  }
  const options = {
    maximumFractionDigits: 2,
    minimumFractionDigits: numberValue % 1 === 0 ? 0 : 2
  };
  return numberValue.toLocaleString('tr-TR', options);
};

const formatDateTime = (value) => {
  if (!value) {
    return '-';
  }

  const tarih = new Date(value);
  if (Number.isNaN(tarih.getTime())) {
    return '-';
  }

  return tarih.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function StockIncreasePage() {
  const router = useRouter();
  const [urunler, setUrunler] = useState([]);
  const [arama, setArama] = useState('');
  const [seciliUrunId, setSeciliUrunId] = useState(null);
  const [eklenecekMiktar, setEklenecekMiktar] = useState('');
  const [not, setNot] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');
  const [basari, setBasari] = useState('');

  const aramaIfadesi = useMemo(() => normalizeText(arama), [arama]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/urunler');
        const data = await response.json();
        if (response.ok) {
          setUrunler(data.urunler || []);
        } else {
          setHata(data.hata || 'Ürünler yüklenemedi');
        }
      } catch (error) {
        console.error('Ürünler yüklenirken hata oluştu', error);
        setHata('Ürünler alınırken bir sorun oluştu');
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (!seciliUrunId) {
      return;
    }
    const mevcut = urunler.find((item) => item.id === seciliUrunId);
    if (!mevcut) {
      setSeciliUrunId(null);
      setEklenecekMiktar('');
      setNot('');
    }
  }, [urunler, seciliUrunId]);

  const filtrelenmisUrunler = useMemo(() => {
    if (!aramaIfadesi) {
      return urunler;
    }
    return urunler.filter((urun) =>
      [urun.ad, urun.barkod, urun.kategori].some((alan) =>
        normalizeText(alan).includes(aramaIfadesi)
      )
    );
  }, [urunler, aramaIfadesi]);

  const aramaAktif = Boolean(aramaIfadesi);

  const seciliUrun = seciliUrunId
    ? urunler.find((item) => item.id === seciliUrunId)
    : null;

  const eklenecekSayisi = Number(eklenecekMiktar);
  const girilecekMiktarMetni =
    Number.isFinite(eklenecekSayisi) && eklenecekSayisi > 0 && seciliUrun
      ? `${formatAmount(eklenecekSayisi)} ${seciliUrun.birim || 'adet'}`
      : '-';
  const tahminiYeniStok =
    seciliUrun && Number.isFinite(eklenecekSayisi) && eklenecekSayisi > 0
      ? Number((Number(seciliUrun.miktar ?? 0) + eklenecekSayisi).toFixed(2))
      : null;
  const tahminiYeniStokMetni =
    tahminiYeniStok !== null && seciliUrun
      ? `${formatAmount(tahminiYeniStok)} ${seciliUrun.birim || 'adet'}`
      : '-';
  const sonHareketler = Array.isArray(seciliUrun?.hareketler)
    ? seciliUrun.hareketler.slice(-5).reverse()
    : [];

  const stokGuncelle = async () => {
    if (!seciliUrun) {
      setHata('Lütfen stok eklemek için bir ürün seçin');
      return;
    }

    const miktarSayisi = Number(eklenecekMiktar);
    if (!Number.isFinite(miktarSayisi) || miktarSayisi <= 0) {
      setHata('Eklenecek miktar pozitif bir sayı olmalıdır');
      return;
    }

    setYukleniyor(true);
    setHata('');
    setBasari('');

    try {
      const response = await fetch('/api/stok-guncelle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          urunId: seciliUrun.id,
          eklenenMiktar: miktarSayisi,
          not: not.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setHata(data.hata || 'Stok güncellenemedi');
        return;
      }

      setUrunler((prev) =>
        prev.map((item) => (item.id === data.urun.id ? data.urun : item))
      );
      setBasari('Stok miktarı başarıyla güncellendi.');
      setEklenecekMiktar('');
      setNot('');
    } catch (error) {
      console.error('Stok güncellenirken hata oluştu', error);
      setHata('Stok güncellenirken bir sorun oluştu');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.push('/')}
            className="mr-4 text-gray-600 hover:text-gray-800"
          >
            ← Geri
          </button>
          <h1 className="text-3xl font-bold text-gray-800">
            Depoya Yeni Stok Girişi Yap
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                <div className="w-full md:w-80">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ürünlerde Ara
                  </label>
                  <input
                    type="text"
                    value={arama}
                    onChange={(e) => setArama(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ürün adı, barkod veya kategori"
                  />
                </div>
                {arama && (
                  <button
                    type="button"
                    onClick={() => setArama('')}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Aramayı temizle
                  </button>
                )}
              </div>

              {filtrelenmisUrunler.length === 0 ? (
                <p className="text-gray-500">
                  {aramaAktif
                    ? 'Arama kriterlerine uygun ürün bulunamadı.'
                    : 'Depoda listelenecek ürün bulunamadı.'}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm text-gray-800">
                    <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-600">
                      <tr>
                        <th className="border-b border-gray-200 px-3 py-3 text-left">#</th>
                        <th className="border-b border-gray-200 px-3 py-3 text-left">Ürün Adı</th>
                        <th className="border-b border-gray-200 px-3 py-3 text-left">Kategori</th>
                        <th className="border-b border-gray-200 px-3 py-3 text-left">Barkod</th>
                        <th className="border-b border-gray-200 px-3 py-3 text-right">Mevcut Stok</th>
                        <th className="border-b border-gray-200 px-3 py-3 text-left">Birim</th>
                        <th className="border-b border-gray-200 px-3 py-3 text-left">Son Güncelleme</th>
                        <th className="border-b border-gray-200 px-3 py-3 text-left">İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtrelenmisUrunler.map((urun, index) => {
                        const aktif = seciliUrunId === urun.id;
                        const satirSinifi = aktif
                          ? 'bg-blue-50'
                          : index % 2 === 1
                            ? 'bg-gray-50'
                            : '';

                        return (
                          <tr
                            key={urun.id}
                            onClick={() => setSeciliUrunId(urun.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                setSeciliUrunId(urun.id);
                              }
                            }}
                            tabIndex={0}
                            className={`${satirSinifi} transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400`}
                          >
                            <td className="border-b border-gray-200 px-3 py-3 text-xs text-gray-500">
                              {index + 1}
                            </td>
                            <td className="border-b border-gray-200 px-3 py-3 font-semibold text-gray-900">
                              {urun.ad}
                            </td>
                            <td className="border-b border-gray-200 px-3 py-3 text-gray-600">
                              {urun.kategori}
                            </td>
                            <td className="border-b border-gray-200 px-3 py-3 text-gray-600">
                              {urun.barkod || '-'}
                            </td>
                            <td className="border-b border-gray-200 px-3 py-3 text-right font-mono text-gray-800">
                              {formatAmount(urun.miktar)}
                            </td>
                            <td className="border-b border-gray-200 px-3 py-3 text-gray-600">
                              {urun.birim || 'adet'}
                            </td>
                            <td className="border-b border-gray-200 px-3 py-3 text-gray-600 whitespace-nowrap">
                              {formatDateTime(urun.guncellemeTarihi || urun.olusturmaTarihi)}
                            </td>
                            <td className="border-b border-gray-200 px-3 py-3">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSeciliUrunId(urun.id);
                                }}
                                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                                  aktif
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-100 text-gray-700 hover:bg-blue-100'
                                }`}
                              >
                                {aktif ? 'Seçildi' : 'Seç'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Stok Güncelleme
              </h2>
              {seciliUrun ? (
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-gray-700">
                      <tbody>
                        <tr className="bg-gray-50">
                          <th className="w-44 px-4 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">
                            Ürün Adı
                          </th>
                          <td className="px-4 py-3 border-b border-gray-200 text-gray-900 font-semibold">
                            {seciliUrun.ad}
                          </td>
                        </tr>
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">
                            Barkod
                          </th>
                          <td className="px-4 py-3 border-b border-gray-200 text-gray-600">
                            {seciliUrun.barkod || '-'}
                          </td>
                        </tr>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">
                            Kategori
                          </th>
                          <td className="px-4 py-3 border-b border-gray-200 text-gray-600">
                            {seciliUrun.kategori}
                          </td>
                        </tr>
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">
                            Güncel Stok
                          </th>
                          <td className="px-4 py-3 border-b border-gray-200 text-gray-900 font-semibold">
                            {formatAmount(seciliUrun.miktar)} {seciliUrun.birim || 'adet'}
                          </td>
                        </tr>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">
                            Eklenecek Miktar
                          </th>
                          <td className="px-4 py-3 border-b border-gray-200 text-gray-600">
                            {girilecekMiktarMetni}
                          </td>
                        </tr>
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">
                            Beklenen Yeni Stok
                          </th>
                          <td className="px-4 py-3 text-gray-900 font-semibold">
                            {tahminiYeniStokMetni}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Depoya Eklenecek Miktar
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={eklenecekMiktar}
                      onChange={(e) => setEklenecekMiktar(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Örn. 12"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Not (opsiyonel)
                    </label>
                    <textarea
                      rows="2"
                      value={not}
                      onChange={(e) => setNot(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Sevkiyat veya açıklama ekleyin"
                    />
                  </div>

                  {sonHareketler.length > 0 ? (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700">
                        Son Stok Hareketleri
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-xs text-gray-700">
                          <thead className="bg-gray-100 text-gray-600 uppercase tracking-wide">
                            <tr>
                              <th className="border-b border-gray-200 px-3 py-2 text-left">Tarih</th>
                              <th className="border-b border-gray-200 px-3 py-2 text-right">Miktar</th>
                              <th className="border-b border-gray-200 px-3 py-2 text-right">Önceki</th>
                              <th className="border-b border-gray-200 px-3 py-2 text-right">Yeni</th>
                              <th className="border-b border-gray-200 px-3 py-2 text-left">Açıklama</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sonHareketler.map((hareket, index) => (
                              <tr key={index} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                                <td className="border-b border-gray-200 px-3 py-2 whitespace-nowrap">
                                  {formatDateTime(hareket.tarih)}
                                </td>
                                <td className="border-b border-gray-200 px-3 py-2 text-right font-mono text-gray-800">
                                  {formatAmount(hareket.miktar)}
                                </td>
                                <td className="border-b border-gray-200 px-3 py-2 text-right font-mono text-gray-600">
                                  {formatAmount(hareket.oncekiMiktar)}
                                </td>
                                <td className="border-b border-gray-200 px-3 py-2 text-right font-mono text-gray-600">
                                  {formatAmount(hareket.yeniMiktar)}
                                </td>
                                <td className="border-b border-gray-200 px-3 py-2 text-gray-600">
                                  {hareket.aciklama || 'Açıklama yok'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}

                  <button
                    onClick={stokGuncelle}
                    disabled={yukleniyor}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold transition-colors"
                  >
                    {yukleniyor ? 'Güncelleniyor...' : 'Stok Miktarını Arttır'}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Stok eklemek için sol taraftan bir ürün seçin.
                </p>
              )}
            </div>

            {(hata || basari) && (
              <div
                className={`rounded-lg p-4 text-sm ${
                  hata
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : 'bg-green-50 border border-green-200 text-green-700'
                }`}
              >
                {hata || basari}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
