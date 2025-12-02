'use client';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Depo Yönetim Sistemi
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div 
            onClick={() => router.push('/urunler')}
            className="bg-white rounded-lg shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow"
          >
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">
              📦 Ürünler
            </h2>
            <p className="text-gray-600">
              Depodaki tüm ürünleri görüntüleyin ve yönetin
            </p>
          </div>

          <div 
            onClick={() => router.push('/urun-ekle')}
            className="bg-white rounded-lg shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow"
          >
            <h2 className="text-2xl font-semibold mb-4 text-green-600">
              ➕ Ürün Ekle
            </h2>
            <p className="text-gray-600">
              Depoya yeni ürün ekleyin
            </p>
          </div>

          <div 
            onClick={() => router.push('/transfer')}
            className="bg-white rounded-lg shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow"
          >
            <h2 className="text-2xl font-semibold mb-4 text-purple-600">
              🔄 Transfer Oluştur
            </h2>
            <p className="text-gray-600">
              Ürünleri seçin, teslim bilgilerini girin ve PDF çıktı alın
            </p>
          </div>

          <div 
            onClick={() => router.push('/transferler')}
            className="bg-white rounded-lg shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow"
          >
            <h2 className="text-2xl font-semibold mb-4 text-indigo-600">
              📜 Transfer Geçmişi
            </h2>
            <p className="text-gray-600">
              Önceki transferleri inceleyin ve PDF çıktıları yeniden açın
            </p>
          </div>

          <div 
            onClick={() => router.push('/stok-guncelle')}
            className="bg-white rounded-lg shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow"
          >
            <h2 className="text-2xl font-semibold mb-4 text-orange-600">
              📈 Stok Arttır
            </h2>
            <p className="text-gray-600">
              Gelen sevkiyatları işleyip mevcut ürün stoklarını artırın
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}