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
    return new Date(tarih).toLocaleDateString('tr-TR', {
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
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-4">
              <div className="px-4 py-3 bg-gray-50 border-b">
                <p className="text-gray-700 font-semibold">
                  Toplam {filtrelenmisUrunler.length} ürün listeleniyor
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtrelenmisUrunler.map((urun) => (
                <div key={urun.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{urun.ad}</h3>
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                      {urun.kategori}
                    </span>
                  </div>

                  {urun.barkod && (
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-semibold">Barkod:</span> {urun.barkod}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    <p className="text-gray-700">
                      <span className="font-semibold">Miktar:</span> {urun.miktar} {urun.birim}
                    </p>
                  </div>

                  <div className="text-xs text-gray-500">
                    <p>Eklenme: {formatTarih(urun.olusturmaTarihi)}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
