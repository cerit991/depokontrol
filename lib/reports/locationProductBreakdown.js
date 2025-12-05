import { readTransfers } from './readTransfers.js';

const normalize = (value) => (value ? String(value).trim().toLowerCase() : '');

export function buildLocationProductBreakdownReport(targetLocations = ['bar', 'mutfak']) {
  const transfers = readTransfers();
  const normalizedTargets = targetLocations.map((location) => normalize(location)).filter(Boolean);
  const locationMap = new Map();

  transfers.forEach((transfer) => {
    const rawLocation = transfer?.hedefKonum ? String(transfer.hedefKonum).trim() : 'Belirtilmedi';
    const normalizedLocation = normalize(rawLocation);

    if (normalizedTargets.length && !normalizedTargets.includes(normalizedLocation)) {
      return;
    }

    if (!locationMap.has(normalizedLocation)) {
      locationMap.set(normalizedLocation, {
        location: rawLocation || 'Belirtilmedi',
        totalQuantity: 0,
        products: new Map()
      });
    }

    const locationEntry = locationMap.get(normalizedLocation);

    if (!Array.isArray(transfer?.urunler)) {
      return;
    }

    transfer.urunler.forEach((urun) => {
      const productId = urun?.id ? String(urun.id) : undefined;
      const productName = urun?.ad ? String(urun.ad) : 'İsimsiz Ürün';
      const amount = Number(urun?.miktar);

      if (Number.isNaN(amount)) {
        return;
      }

      locationEntry.totalQuantity += amount;

      if (!productId && !productName) {
        return;
      }

      const productKey = productId || productName;
      if (!locationEntry.products.has(productKey)) {
        locationEntry.products.set(productKey, {
          productId: productId || null,
          name: productName,
          category: urun?.kategori ? String(urun.kategori) : 'Kategori Yok',
          totalQuantity: 0
        });
      }

      const productEntry = locationEntry.products.get(productKey);
      productEntry.totalQuantity += amount;
    });
  });

  const locations = Array.from(locationMap.values()).map((entry) => ({
    location: entry.location,
    totalQuantity: Number(entry.totalQuantity.toFixed(2)),
    products: Array.from(entry.products.values())
      .map((product) => ({
        ...product,
        totalQuantity: Number(product.totalQuantity.toFixed(2))
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
  }));

  return { locations };
}
