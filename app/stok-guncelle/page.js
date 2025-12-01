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
    const kriter = normalizeText(arama);
    if (!kriter) {
      return urunler;
    }
    return urunler.filter((urun) =>
      [urun.ad, urun.barkod, urun.kategori].some((alan) =>
        normalizeText(alan).includes(kriter)
      )
    );
  }, [urunler, arama]);

  const seciliUrun = seciliUrunId
    ? urunler.find((item) => item.id === seciliUrunId)
    : null;

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
                <p className="text-gray-500">Arama kriterine uygun ürün bulunamadı.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filtrelenmisUrunler.map((urun) => {
                    const aktif = seciliUrunId === urun.id;
                    return (
                      <button
                        key={urun.id}
                        type="button"
                        onClick={() => setSeciliUrunId(urun.id)}
                        className={`text-left border rounded-lg p-4 transition-colors ${
                          aktif
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-blue-300'
                        }`}
                      >
                        <h3 className="text-lg font-semibold text-gray-800">
                          {urun.ad}
                        </h3>
                        <p className="text-sm text-gray-500">Barkod: {urun.barkod}</p>
                        <p className="text-sm text-gray-500">Kategori: {urun.kategori}</p>
                        <p className="text-sm text-gray-500">
                          Depoda Mevcut: {formatAmount(urun.miktar)} {urun.birim}
                        </p>
                      </button>
                    );
                  })}
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
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <p className="text-sm text-gray-600">Seçilen Ürün</p>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {seciliUrun.ad}
                    </h3>
                    <p className="text-sm text-gray-500">Barkod: {seciliUrun.barkod}</p>
                    <p className="text-sm text-gray-500">Kategori: {seciliUrun.kategori}</p>
                    <p className="text-sm text-gray-600 font-medium">
                      Güncel Stok: {formatAmount(seciliUrun.miktar)} {seciliUrun.birim}
                    </p>
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

                  {seciliUrun?.hareketler?.length ? (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        Son 3 Stok Hareketi
                      </p>
                      <ul className="space-y-2 text-sm text-gray-600">
                        {seciliUrun.hareketler
                          .slice(-3)
                          .reverse()
                          .map((hareket, index) => (
                            <li key={index} className="flex flex-col">
                              <span>
                                {formatAmount(hareket.miktar)} {seciliUrun.birim} eklendi
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(hareket.tarih).toLocaleString('tr-TR')} — {hareket.aciklama || 'Açıklama yok'}
                              </span>
                            </li>
                          ))}
                      </ul>
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
