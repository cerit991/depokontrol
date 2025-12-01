'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UrunEklePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ad: '',
    kategori: '',
    miktar: '',
    birim: 'adet'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/urun-ekle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Ürün başarıyla eklendi! Oluşturulan barkod: ${data?.urun?.barkod || 'bilinmiyor'}`);
        setFormData({
          ad: '',
          kategori: '',
          miktar: '',
          birim: 'adet'
        });
        router.push('/urunler');
      } else {
        alert(data.hata || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('Hata:', error);
      alert('Ürün eklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-6">
            <button
              onClick={() => router.push('/')}
              className="mr-4 text-gray-600 hover:text-gray-800"
            >
              ← Geri
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Yeni Ürün Ekle</h1>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Ürün Adı *
              </label>
              <input
                type="text"
                name="ad"
                value={formData.ad}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Örn: Laptop"
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Kategori *
              </label>
              <input
                type="text"
                name="kategori"
                value={formData.kategori}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Örn: Elektronik"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Miktar *
                </label>
                <input
                  type="number"
                  name="miktar"
                  value={formData.miktar}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Birim *
                </label>
                <select
                  name="birim"
                  value={formData.birim}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="adet">Adet</option>
                  <option value="kg">Kilogram</option>
                  <option value="lt">Litre</option>
                  <option value="m">Metre</option>
                  <option value="paket">Paket</option>
                </select>
              </div>
            </div>

            <p className="mb-6 text-sm text-gray-600">
              Barkod, ürünü kaydettiğinizde sistem tarafından otomatik oluşturulur.
            </p>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold transition-colors"
              >
                {loading ? 'Ekleniyor...' : '✓ Ürünü Ekle'}
              </button>
              
              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
