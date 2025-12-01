'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const baslangicFormu = {
  teslimEden: 'Halil İbrahim Cerit',
  teslimAlan: 'Ener Alikan',
  hedefKonum: 'Bar',
  aciklama: ''
};

const normalizeText = (value) =>
  (value ?? '')
    .toString()
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

export default function TransferPage() {
  const router = useRouter();
  const [urunler, setUrunler] = useState([]);
  const [arama, setArama] = useState('');
  const [miktarHaritasi, setMiktarHaritasi] = useState({});
  const [form, setForm] = useState(baslangicFormu);
  const [secilenUrunler, setSecilenUrunler] = useState([]);
  const [ozetHazir, setOzetHazir] = useState(false);
  const [sabitOzet, setSabitOzet] = useState(false);
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [transferSonucu, setTransferSonucu] = useState(null);
  const ozetRef = useRef(null);

  useEffect(() => {
    urunleriGetir();
  }, []);

  const urunleriGetir = async () => {
    try {
      const yanit = await fetch('/api/urunler');
      const veri = await yanit.json();
      if (yanit.ok) {
        setUrunler(veri.urunler || []);
      } else {
        setHata(veri.hata || 'Ürünler yüklenemedi');
      }
    } catch (error) {
      console.error('Urunleri getirirken hata', error);
      setHata('Ürünler alınırken bir sorun oluştu');
    }
  };

  const handleFormDegisim = (e) => {
    const { name, value } = e.target;
    if (name === 'teslimEden') {
      return;
    }
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMiktarDegisim = (urunId, maxMiktar, value) => {
    const sayiDegeri = Math.max(0, Math.min(Number(value) || 0, maxMiktar));
    setMiktarHaritasi((prev) => ({
      ...prev,
      [urunId]: sayiDegeri
    }));
  };

  const listeOlustur = () => {
    setHata('');
    const secim = urunler
      .map((urun) => ({
        ...urun,
        transferMiktari: Number(miktarHaritasi[urun.id]) || 0
      }))
      .filter((urun) => urun.transferMiktari > 0);

    if (secim.length === 0) {
      setHata('Lütfen transfer için en az bir ürün miktarı girin.');
      setOzetHazir(false);
      return;
    }

    if (!form.teslimEden || !form.teslimAlan || !form.hedefKonum) {
      setHata('Teslim eden, teslim alan ve hedef konum alanları zorunludur.');
      setOzetHazir(false);
      return;
    }

    setSecilenUrunler(secim);
    setOzetHazir(true);
    setTransferSonucu(null);
  };

  const transferiOnayla = async () => {
    if (!ozetHazir || secilenUrunler.length === 0) {
      return;
    }

    setYukleniyor(true);
    setHata('');

    try {
      const yanit = await fetch('/api/transfer-olustur', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teslimEden: form.teslimEden,
          teslimAlan: form.teslimAlan,
          hedefKonum: form.hedefKonum,
          aciklama: form.aciklama,
          urunler: secilenUrunler.map((urun) => ({
            id: urun.id,
            miktar: urun.transferMiktari
          }))
        })
      });

      const veri = await yanit.json();

      if (!yanit.ok) {
        setHata(veri.hata || 'Transfer kaydedilemedi');
        return;
      }

      setTransferSonucu(veri.transfer);
      setOzetHazir(false);
      setSecilenUrunler([]);
      setMiktarHaritasi({});
      setForm(baslangicFormu);
      urunleriGetir();

      if (veri.transfer?.id) {
        window.open(`/api/transfer-pdf/${veri.transfer.id}`, '_blank');
      }
    } catch (error) {
      console.error('Transfer oluşturulurken hata', error);
      setHata('Transfer oluşturulurken bir sorun oluştu');
    } finally {
      setYukleniyor(false);
    }
  };

  const formatTarih = (tarih) => {
    return new Date(tarih).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMiktar = (deger) => {
    if (deger === null || deger === undefined) {
      return '-';
    }
    const sayi = Number(deger);
    if (Number.isNaN(sayi)) {
      return '-';
    }
    const options = {
      maximumFractionDigits: 2,
      minimumFractionDigits: sayi % 1 === 0 ? 0 : 2
    };
    return sayi.toLocaleString('tr-TR', options);
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
          <h1 className="text-3xl font-bold text-gray-800">Depodan Transfer Oluştur</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Transfer Bilgileri</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Teslim Eden *</label>
                  <input
                    type="text"
                    name="teslimEden"
                    value={form.teslimEden}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Teslim Alan *</label>
                  <select
                    name="teslimAlan"
                    value={form.teslimAlan}
                    onChange={handleFormDegisim}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Ener Alikan">Ener Alikan</option>
                    <option value="Barboy">Barboy</option>
                    <option value="Mutfak Şefi">Mutfak Şefi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Hedef Konum *</label>
                  <select
                    name="hedefKonum"
                    value={form.hedefKonum}
                    onChange={handleFormDegisim}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Bar">Bar</option>
                    <option value="Mutfak">Mutfak</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Not</label>
                  <textarea
                    name="aciklama"
                    value={form.aciklama}
                    onChange={handleFormDegisim}
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Opsiyonel not"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Ürün Seçimi</h2>
              <p className="text-sm text-gray-600 mb-4">Transfer etmek istediğiniz ürünler için gönderilecek miktarı girin. Miktara 0 yazmak ürünü seçmez.</p>

              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <label className="w-full md:w-64">
                    <span className="block text-sm font-semibold text-gray-700 mb-2">Ürünlerde Ara</span>
                    <input
                      type="text"
                      value={arama}
                      onChange={(e) => setArama(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ürün adı, barkod veya kategori"
                    />
                  </label>
                  {arama && (
                    <button
                      type="button"
                      onClick={() => setArama('')}
                      className="self-end md:self-center text-sm text-blue-600 hover:underline"
                    >
                      Aramayı temizle
                    </button>
                  )}
                </div>

                {urunler.length === 0 ? (
                  <p className="text-gray-500">Depoda listelenecek ürün bulunamadı.</p>
                ) : (
                  urunler
                    .filter((urun) => {
                      if (!arama) {
                        return true;
                      }
                      const aramaMetni = normalizeText(arama);
                      if (!aramaMetni) {
                        return true;
                      }
                      const alanlar = [urun.ad, urun.barkod, urun.kategori];
                      return alanlar.some((alan) =>
                        normalizeText(alan).includes(aramaMetni)
                      );
                    })
                    .map((urun) => {
                      const girilenMiktar = Number(miktarHaritasi[urun.id] ?? 0);
                      const kalanMiktar = Math.max(0, Number(urun.miktar ?? 0) - girilenMiktar);
                      const secildi = girilenMiktar > 0;
                      return (
                        <div
                          key={urun.id}
                          className={`border rounded-lg p-4 transition-all ${
                            secildi
                              ? 'border-blue-400 bg-blue-50 shadow-lg shadow-blue-100'
                              : 'border-gray-200 bg-white shadow-sm'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                {urun.ad}
                                {secildi && (
                                  <span className="inline-flex items-center rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                                    Seçildi
                                  </span>
                                )}
                              </h3>
                              <p className="text-sm text-gray-500">Kategori: {urun.kategori}</p>
                              <p className="text-sm text-gray-500">Barkod: {urun.barkod}</p>
                              <p className="text-sm text-gray-500">Depodaki Miktar: {formatMiktar(urun.miktar)} {urun.birim}</p>
                              <p className="text-sm text-gray-500">Transfer sonrası depoda kalacak: {formatMiktar(kalanMiktar)} {urun.birim}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max={urun.miktar}
                                value={miktarHaritasi[urun.id] ?? ''}
                                onChange={(e) => handleMiktarDegisim(urun.id, urun.miktar, e.target.value)}
                                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0"
                              />
                              <span className="text-sm text-gray-600">{urun.birim}</span>
                            </div>
                          </div>
                          {secildi && (
                            <div className="mt-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setSabitOzet(true);
                                  if (ozetRef.current) {
                                    ozetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  }
                                }}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                              >
                                Özete git ↑
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>

          <div className={`space-y-6 ${sabitOzet ? 'lg:sticky lg:top-6 lg:h-fit' : ''}`}>
            <div ref={ozetRef} className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Transfer Özeti</h2>
              <button
                onClick={listeOlustur}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
              >
                Transfer Listesini Oluştur
              </button>

              <div className="flex items-center justify-between mt-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={sabitOzet}
                    onChange={(e) => setSabitOzet(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Özeti ekranda sabitle
                </label>
              </div>

              {hata && (
                <p className="mt-4 text-sm text-red-600">{hata}</p>
              )}

              {ozetHazir && (
                <div className="mt-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Teslim Bilgileri</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li><span className="font-semibold">Teslim Eden:</span> {form.teslimEden}</li>
                      <li><span className="font-semibold">Teslim Alan:</span> {form.teslimAlan}</li>
                      <li><span className="font-semibold">Hedef Konum:</span> {form.hedefKonum}</li>
                      {form.aciklama && (
                        <li><span className="font-semibold">Not:</span> {form.aciklama}</li>
                      )}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Seçilen Ürünler</h3>
                    <ul className="text-sm text-gray-600 space-y-2">
                      {secilenUrunler.map((urun) => {
                        const kalan = Math.max(
                          0,
                          Number(urun.miktar ?? 0) - Number(urun.transferMiktari ?? 0)
                        );
                        return (
                          <li key={urun.id} className="border border-gray-200 rounded-lg p-3">
                            <p className="font-semibold text-gray-800">{urun.ad}</p>
                            <p>Barkod: {urun.barkod}</p>
                            <p>Gönderilecek: {formatMiktar(urun.transferMiktari)} {urun.birim}</p>
                            <p>Transfer sonrası depoda kalacak: {formatMiktar(kalan)} {urun.birim}</p>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                    Bu ürünleri transfer etmek istediğinize emin misiniz?
                  </div>

                  <button
                    onClick={transferiOnayla}
                    disabled={yukleniyor}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold transition-colors"
                  >
                    {yukleniyor ? 'Transfer ediliyor...' : 'Evet, Transferi Tamamla'}
                  </button>
                </div>
              )}
            </div>

            {transferSonucu && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-sm text-green-800">
                <h3 className="text-lg font-semibold text-green-700 mb-2">Transfer Başarıyla Oluşturuldu</h3>
                <p className="mb-2">Transfer No: {transferSonucu.id}</p>
                <p className="mb-4">Oluşturulma: {formatTarih(transferSonucu.olusturmaTarihi)}</p>
                {Array.isArray(transferSonucu.urunler) && transferSonucu.urunler.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {transferSonucu.urunler.map((urun) => (
                      <div key={urun.id} className="bg-white border border-green-100 rounded-lg p-3 text-gray-700">
                        <p className="font-semibold text-gray-800">{urun.ad}</p>
                        <p>Barkod: {urun.barkod}</p>
                        <p>Gönderilen: {formatMiktar(urun.miktar)} {urun.birim}</p>
                        <p>Transfer sonrası depoda kalan: {formatMiktar(urun.kalanMiktar)} {urun.birim}</p>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => window.open(`/api/transfer-pdf/${transferSonucu.id}`, '_blank')}
                  className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 font-semibold transition-colors"
                >
                  PDF Çıktısını Yeniden İndir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
