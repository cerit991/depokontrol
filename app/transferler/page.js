'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const normalizeText = (value) =>
  (value ?? '')
    .toString()
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

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

export default function TransferListPage() {
  const router = useRouter();
  const [transferler, setTransferler] = useState([]);
  const [arama, setArama] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');

  useEffect(() => {
    const fetchTransfers = async () => {
      setYukleniyor(true);
      setHata('');
      try {
        const response = await fetch('/api/transferler');
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.hata || 'Transferler yüklenemedi');
        }
        setTransferler(Array.isArray(data.transferler) ? data.transferler : []);
      } catch (error) {
        console.error('Transferler alınırken hata oluştu:', error);
        setHata(error.message || 'Transferler yüklenirken bir sorun oluştu');
      } finally {
        setYukleniyor(false);
      }
    };

    fetchTransfers();
  }, []);

  const aramaIfadesi = useMemo(() => normalizeText(arama), [arama]);

  const filtrelenmisTransferler = useMemo(() => {
    if (!aramaIfadesi) {
      return transferler;
    }

    return transferler.filter((transfer) => {
      const urunIsimleri = Array.isArray(transfer.urunler)
        ? transfer.urunler.map((urun) => urun.ad).join(' ')
        : '';
      const alanlar = [
        transfer.id,
        transfer.teslimEden,
        transfer.teslimAlan,
        transfer.hedefKonum,
        transfer.aciklama,
        urunIsimleri
      ];
      return alanlar.some((alan) => normalizeText(alan).includes(aramaIfadesi));
    });
  }, [transferler, aramaIfadesi]);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Geri
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Önceki Transferler</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/transfer')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
            >
              Yeni Transfer Oluştur
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="w-full md:w-96">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Transferlerde Ara
              </label>
              <input
                type="text"
                value={arama}
                onChange={(event) => setArama(event.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Transfer no, teslim alan, hedef konum veya ürün adı"
              />
            </div>
            {arama && (
              <button
                type="button"
                onClick={() => setArama('')}
                className="text-sm text-blue-600 hover:underline self-end md:self-center"
              >
                Aramayı temizle
              </button>
            )}
          </div>
        </div>

        {yukleniyor ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center text-gray-600">
            Yükleniyor...
          </div>
        ) : hata ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6">
            {hata}
          </div>
        ) : filtrelenmisTransferler.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center text-gray-600">
            Kayıtlı transfer bulunamadı.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
            <table className="min-w-full border-collapse text-sm text-gray-800">
              <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="border-b border-gray-200 px-4 py-3 text-left">Transfer No</th>
                  <th className="border-b border-gray-200 px-4 py-3 text-left">Oluşturulma</th>
                  <th className="border-b border-gray-200 px-4 py-3 text-left">Teslim Eden</th>
                  <th className="border-b border-gray-200 px-4 py-3 text-left">Teslim Alan</th>
                  <th className="border-b border-gray-200 px-4 py-3 text-left">Hedef Konum</th>
                  <th className="border-b border-gray-200 px-4 py-3 text-left">Ürün Sayısı</th>
                  <th className="border-b border-gray-200 px-4 py-3 text-left">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filtrelenmisTransferler.map((transfer, index) => (
                  <tr key={transfer.id} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                    <td className="border-b border-gray-200 px-4 py-3 font-semibold text-gray-900">
                      {transfer.id}
                    </td>
                    <td className="border-b border-gray-200 px-4 py-3 text-gray-600 whitespace-nowrap">
                      {formatDateTime(transfer.olusturmaTarihi)}
                    </td>
                    <td className="border-b border-gray-200 px-4 py-3 text-gray-600">
                      {transfer.teslimEden}
                    </td>
                    <td className="border-b border-gray-200 px-4 py-3 text-gray-600">
                      {transfer.teslimAlan}
                    </td>
                    <td className="border-b border-gray-200 px-4 py-3 text-gray-600">
                      {transfer.hedefKonum}
                    </td>
                    <td className="border-b border-gray-200 px-4 py-3 text-gray-600">
                      {Array.isArray(transfer.urunler) ? transfer.urunler.length : 0}
                    </td>
                    <td className="border-b border-gray-200 px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => router.push(`/transferler/${transfer.id}`)}
                          className="px-3 py-1 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                        >
                          Detay
                        </button>
                        <button
                          type="button"
                          onClick={() => window.open(`/api/transfer-pdf/${transfer.id}`, '_blank')}
                          className="px-3 py-1 rounded-md bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors"
                        >
                          PDF Aç
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
