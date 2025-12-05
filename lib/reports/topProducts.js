import { readTransfers } from './readTransfers.js';

export function buildTopProductsReport(limit = 5) {
  const transfers = readTransfers();
  const productMap = new Map();

  transfers.forEach((transfer) => {
    if (!Array.isArray(transfer.urunler)) {
      return;
    }

    transfer.urunler.forEach((urun) => {
      const productId = urun?.id ? String(urun.id) : undefined;
      if (!productId) {
        return;
      }

      if (!productMap.has(productId)) {
        productMap.set(productId, {
          productId,
          name: urun?.ad ? String(urun.ad) : 'İsimsiz Ürün',
          category: urun?.kategori ? String(urun.kategori) : 'Kategori Yok',
          totalQuantity: 0
        });
      }

      const entry = productMap.get(productId);
      const amount = Number(urun?.miktar);
      if (!Number.isNaN(amount)) {
        entry.totalQuantity += amount;
      }
    });
  });

  const sorted = Array.from(productMap.values())
    .map((entry) => ({
      ...entry,
      totalQuantity: Number(entry.totalQuantity.toFixed(2))
    }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, Math.max(limit, 1));

  return { products: sorted };
}
