import { readTransfers } from './readTransfers.js';

const MS_IN_DAY = 1000 * 60 * 60 * 24;

const normalizeKey = (value) => (value ? String(value).trim().toLowerCase() : '');

export function buildServiceSpeedReport() {
  const transfers = readTransfers();

  if (!Array.isArray(transfers) || transfers.length === 0) {
    return {
      locations: [],
      fastestProducts: [],
      slowestProducts: [],
      singleTransferProducts: []
    };
  }

  const sortedTransfers = [...transfers].sort((a, b) => {
    const timeA = new Date(a?.olusturmaTarihi).getTime();
    const timeB = new Date(b?.olusturmaTarihi).getTime();
    if (Number.isNaN(timeA) || Number.isNaN(timeB)) {
      return 0;
    }
    return timeA - timeB;
  });

  const locationStats = new Map();
  const productStats = new Map();

  sortedTransfers.forEach((transfer) => {
    const rawLocation = transfer?.hedefKonum ? String(transfer.hedefKonum).trim() : 'Belirtilmedi';
    const locationKey = normalizeKey(rawLocation);
    const transferDate = new Date(transfer?.olusturmaTarihi);
    const timestamp = transferDate.getTime();

    if (Number.isNaN(timestamp)) {
      return;
    }

    if (!locationStats.has(locationKey)) {
      locationStats.set(locationKey, {
        location: rawLocation || 'Belirtilmedi',
        intervalsSum: 0,
        intervalsCount: 0,
        totalTransfers: 0,
        uniqueProducts: new Set(),
        lastTransferTimestamp: null
      });
    }

    const locationEntry = locationStats.get(locationKey);
    locationEntry.totalTransfers += 1;
    if (!locationEntry.lastTransferTimestamp || timestamp > locationEntry.lastTransferTimestamp) {
      locationEntry.lastTransferTimestamp = timestamp;
    }

    if (!Array.isArray(transfer?.urunler)) {
      return;
    }

    transfer.urunler.forEach((urun) => {
      const productId = urun?.id ? String(urun.id) : null;
      const productName = urun?.ad ? String(urun.ad) : 'İsimsiz Ürün';
      const quantity = Number(urun?.miktar);

      if (Number.isNaN(quantity)) {
        return;
      }

      const productKey = `${locationKey}::${productId || productName}`;

      if (!productStats.has(productKey)) {
        productStats.set(productKey, {
          location: rawLocation || 'Belirtilmedi',
          productId,
          name: productName,
          category: urun?.kategori ? String(urun.kategori) : 'Kategori Yok',
          previousTimestamp: null,
          lastTimestamp: null,
          intervalsSum: 0,
          intervalsCount: 0,
          lastInterval: null,
          firstTimestamp: timestamp,
          totalQuantity: 0,
          transferCount: 0
        });
      }

      const productEntry = productStats.get(productKey);
      productEntry.transferCount += 1;
      productEntry.totalQuantity += quantity;

      if (productEntry.lastTimestamp !== null) {
        const diffDays = (timestamp - productEntry.lastTimestamp) / MS_IN_DAY;
        if (diffDays > 0) {
          productEntry.intervalsSum += diffDays;
          productEntry.intervalsCount += 1;
          productEntry.lastInterval = diffDays;

          locationEntry.intervalsSum += diffDays;
          locationEntry.intervalsCount += 1;
        }
      }

      productEntry.previousTimestamp = productEntry.lastTimestamp;
      productEntry.lastTimestamp = timestamp;

      locationEntry.uniqueProducts.add(productKey);
    });
  });

  const locationSummaries = Array.from(locationStats.values()).map((entry) => ({
    location: entry.location,
    averageIntervalDays: entry.intervalsCount
      ? Number((entry.intervalsSum / entry.intervalsCount).toFixed(2))
      : null,
    totalTransfers: entry.totalTransfers,
    distinctProductCount: entry.uniqueProducts.size,
    lastTransferDate: entry.lastTransferTimestamp
      ? new Date(entry.lastTransferTimestamp).toISOString()
      : null
  }));

  const productSummaries = Array.from(productStats.values()).map((entry) => ({
    location: entry.location,
    productId: entry.productId,
    name: entry.name,
    category: entry.category,
    averageIntervalDays: entry.intervalsCount
      ? Number((entry.intervalsSum / entry.intervalsCount).toFixed(2))
      : null,
    lastIntervalDays: entry.lastInterval ? Number(entry.lastInterval.toFixed(2)) : null,
    lastTransferDate: entry.lastTimestamp ? new Date(entry.lastTimestamp).toISOString() : null,
    firstTransferDate: entry.firstTimestamp ? new Date(entry.firstTimestamp).toISOString() : null,
    totalQuantity: Number(entry.totalQuantity.toFixed(2)),
    transferCount: entry.transferCount
  }));

  const fastestProducts = productSummaries
    .filter((entry) => entry.averageIntervalDays !== null)
    .sort((a, b) => a.averageIntervalDays - b.averageIntervalDays)
    .slice(0, 10);

  const slowestProducts = productSummaries
    .filter((entry) => entry.averageIntervalDays !== null)
    .sort((a, b) => b.averageIntervalDays - a.averageIntervalDays)
    .slice(0, 10);

  const singleTransferProducts = productSummaries
    .filter((entry) => entry.averageIntervalDays === null)
    .sort((a, b) => {
      const timeA = new Date(a.lastTransferDate).getTime();
      const timeB = new Date(b.lastTransferDate).getTime();
      if (Number.isNaN(timeA) || Number.isNaN(timeB)) {
        return 0;
      }
      return timeB - timeA;
    })
    .slice(0, 10);

  return {
    locations: locationSummaries,
    fastestProducts,
    slowestProducts,
    singleTransferProducts
  };
}
