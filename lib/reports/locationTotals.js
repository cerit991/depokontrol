import { readTransfers } from './readTransfers.js';

export function buildLocationTotalsReport() {
  const transfers = readTransfers();
  const locationMap = new Map();

  transfers.forEach((transfer) => {
    const locationName = transfer?.hedefKonum ? String(transfer.hedefKonum) : 'Belirtilmedi';
    if (!locationMap.has(locationName)) {
      locationMap.set(locationName, {
        location: locationName,
        transferCount: 0,
        totalQuantity: 0,
        uniqueProducts: new Set()
      });
    }

    const entry = locationMap.get(locationName);
    entry.transferCount += 1;

    if (!Array.isArray(transfer.urunler)) {
      return;
    }

    transfer.urunler.forEach((urun) => {
      const amount = Number(urun?.miktar);
      if (!Number.isNaN(amount)) {
        entry.totalQuantity += amount;
      }

      if (urun?.id) {
        entry.uniqueProducts.add(String(urun.id));
      }
    });
  });

  const sorted = Array.from(locationMap.values())
    .map((entry) => ({
      location: entry.location,
      transferCount: entry.transferCount,
      totalQuantity: Number(entry.totalQuantity.toFixed(2)),
      distinctProductCount: entry.uniqueProducts.size
    }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity);

  return { locations: sorted };
}
