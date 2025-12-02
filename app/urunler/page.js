'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UrunlerPage() {
  const router = useRouter();
  const [urunler, setUrunler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aramaMetni, setAramaMetni] = useState('');

  useEffect(() => {
    fetchUrunler();
  }, []);

  const fetchUrunler = async () => {
    try {
      const response = await fetch('/api/urunler');
      const data = await response.json();
      
      if (response.ok) {
        setUrunler(data.urunler || []);
      } else {
        console.error('Ürünler yüklenemedi:', data.hata);
      }
    } catch (error) {
      console.error('Hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtrelenmisUrunler = urunler.filter((urun) => {
    const arama = aramaMetni.toLowerCase();
    return (
      urun.ad.toLowerCase().includes(arama) ||
      urun.kategori.toLowerCase().includes(arama) ||
      (urun.barkod || '').toLowerCase().includes(arama)
    );
  });

  const formatTarih = (tarih) => {
    if (!tarih) {
      return '-';
    }

    const tarihObjesi = new Date(tarih);
    if (Number.isNaN(tarihObjesi.getTime())) {
      return '-';
    }

    return tarihObjesi.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/')}
              className="mr-4 text-gray-600 hover:text-gray-800"
            >
              ← Geri
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Depo Ürünleri</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/transfer')}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-semibold transition-colors"
            >
              Transfer Oluştur
            </button>
            <button
              onClick={() => router.push('/urun-ekle')}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold transition-colors"
            >
              + Yeni Ürün Ekle
            </button>
          </div>
        </div>

        {/* Arama Bölümü */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Ürün adı, kategori veya barkod ile ara..."
            value={aramaMetni}
            onChange={(e) => setAramaMetni(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Yükleniyor...</p>
          </div>
        ) : filtrelenmisUrunler.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-xl text-gray-600 mb-4">
              {aramaMetni ? 'Arama kriterlerine uygun ürün bulunamadı' : 'Henüz depoda ürün bulunmuyor'}
            </p>
            {!aramaMetni && (
              <button
                onClick={() => router.push('/urun-ekle')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold transition-colors"
              >
                İlk Ürünü Ekle
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-lg">
              <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between text-sm text-gray-600">
                <span>Toplam {filtrelenmisUrunler.length} ürün listeleniyor</span>
                <span>Kayıtlar Excel benzeri tablo görünümünde sıralanır</span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead className="bg-gray-100 text-gray-700 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="border-b border-gray-200 px-4 py-3 text-left">#</th>
                      <th className="border-b border-gray-200 px-4 py-3 text-left">Ürün Adı</th>
                      <th className="border-b border-gray-200 px-4 py-3 text-left">Kategori</th>
                      <th className="border-b border-gray-200 px-4 py-3 text-left">Barkod</th>
                      <th className="border-b border-gray-200 px-4 py-3 text-right">Miktar</th>
                      <th className="border-b border-gray-200 px-4 py-3 text-left">Birim</th>
                      <th className="border-b border-gray-200 px-4 py-3 text-left">Eklenme Tarihi</th>
                      <th className="border-b border-gray-200 px-4 py-3 text-left">Son Güncelleme</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-800">
                    {filtrelenmisUrunler.map((urun, index) => {
                      const formatliMiktar = Number(urun.miktar ?? 0).toLocaleString('tr-TR', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2
                      });

                      return (
                        <tr key={urun.id} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                          <td className="border-b border-gray-200 px-4 py-3 text-left text-xs text-gray-500">
                            {index + 1}
                          </td>
                          <td className="border-b border-gray-200 px-4 py-3 font-semibold">
                            {urun.ad}
                          </td>
                          <td className="border-b border-gray-200 px-4 py-3 text-gray-600">
                            {urun.kategori}
                          </td>
                          <td className="border-b border-gray-200 px-4 py-3 text-gray-600">
                            {urun.barkod || '-'}
                          </td>
                          <td className="border-b border-gray-200 px-4 py-3 text-right font-mono">
                            {formatliMiktar}
                          </td>
                          <td className="border-b border-gray-200 px-4 py-3 text-gray-600">
                            {urun.birim || 'adet'}
                          </td>
                          <td className="border-b border-gray-200 px-4 py-3 text-gray-500 whitespace-nowrap">
                            {formatTarih(urun.olusturmaTarihi)}
                          </td>
                          <td className="border-b border-gray-200 px-4 py-3 text-gray-500 whitespace-nowrap">
                            {formatTarih(urun.guncellemeTarihi || urun.olusturmaTarihi)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
