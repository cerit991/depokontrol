import { readTransfers } from './readTransfers.js';

export function buildCategoryTotalsReport() {
  const transfers = readTransfers();
  const categoryMap = new Map();

  transfers.forEach((transfer) => {
    if (!Array.isArray(transfer.urunler)) {
      return;
    }

    transfer.urunler.forEach((urun) => {
      const categoryName = urun?.kategori ? String(urun.kategori) : 'Kategori Yok';
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          category: categoryName,
          totalQuantity: 0,
          productCount: 0
        });
      }

      const entry = categoryMap.get(categoryName);
      const amount = Number(urun?.miktar);
      if (!Number.isNaN(amount)) {
        entry.totalQuantity += amount;
      }
      entry.productCount += 1;
    });
  });

  const sorted = Array.from(categoryMap.values())
    .map((entry) => ({
      category: entry.category,
      totalQuantity: Number(entry.totalQuantity.toFixed(2)),
      lineCount: entry.productCount
    }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity);

  return { categories: sorted };
}
