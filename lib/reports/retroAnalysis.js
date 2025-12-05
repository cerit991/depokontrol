import { readTransfers } from './readTransfers.js';

const MS_IN_DAY = 1000 * 60 * 60 * 24;

const toStartOfDay = (timestamp) => {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const parseTimestamp = (value) => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
};

const formatDateKey = (timestamp) => {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
};

const normalizeString = (value, fallback = 'Belirtilmedi') => {
  if (!value && value !== 0) {
    return fallback;
  }
  const stringValue = String(value).trim();
  return stringValue.length ? stringValue : fallback;
};

export function buildRetroAnalysisReport({ startDate, endDate } = {}) {
  const transfers = readTransfers();

  if (!Array.isArray(transfers) || transfers.length === 0) {
    return {
      summary: {
        totalTransfers: 0,
        totalQuantity: 0,
        distinctProductCount: 0,
        distinctLocationCount: 0
      },
      timeline: [],
      topLocations: [],
      topProducts: [],
      events: [],
      filters: {
        startDate: null,
        endDate: null
      }
    };
  }

  const startTimestamp = startDate ? parseTimestamp(startDate) : null;
  const endTimestamp = endDate ? parseTimestamp(endDate) : null;

  let actualStart = startTimestamp;
  let actualEnd = endTimestamp;

  const filteredTransfers = transfers
    .map((transfer) => {
      const timestamp = parseTimestamp(transfer?.olusturmaTarihi);
      return { ...transfer, _timestamp: timestamp };
    })
    .filter((transfer) => transfer._timestamp !== null)
    .filter((transfer) => {
      if (startTimestamp && transfer._timestamp < toStartOfDay(startTimestamp)) {
        return false;
      }
      if (endTimestamp && transfer._timestamp > toStartOfDay(endTimestamp) + MS_IN_DAY - 1) {
        return false;
      }
      return true;
    });

  if (filteredTransfers.length === 0) {
    return {
      summary: {
        totalTransfers: 0,
        totalQuantity: 0,
        distinctProductCount: 0,
        distinctLocationCount: 0
      },
      timeline: [],
      topLocations: [],
      topProducts: [],
      events: [],
      filters: {
        startDate: startTimestamp ? new Date(toStartOfDay(startTimestamp)).toISOString() : null,
        endDate: endTimestamp ? new Date(toStartOfDay(endTimestamp)).toISOString() : null
      }
    };
  }

  if (!actualStart) {
    actualStart = filteredTransfers.reduce(
      (min, transfer) => (transfer._timestamp < min ? transfer._timestamp : min),
      filteredTransfers[0]._timestamp
    );
  }

  if (!actualEnd) {
    actualEnd = filteredTransfers.reduce(
      (max, transfer) => (transfer._timestamp > max ? transfer._timestamp : max),
      filteredTransfers[0]._timestamp
    );
  }

  actualStart = toStartOfDay(actualStart);
  actualEnd = toStartOfDay(actualEnd);

  const summary = {
    totalTransfers: 0,
    totalQuantity: 0,
    distinctProductCount: 0,
    distinctLocationCount: 0
  };

  const productIds = new Set();
  const locationKeys = new Set();
  const timelineMap = new Map();
  const locationMap = new Map();
  const productMap = new Map();

  filteredTransfers.forEach((transfer) => {
    const timestamp = transfer._timestamp;
    const location = normalizeString(transfer?.hedefKonum);
    const locationKey = location.toLowerCase();
    const dayKey = formatDateKey(timestamp);

    summary.totalTransfers += 1;
    locationKeys.add(locationKey);

    if (!timelineMap.has(dayKey)) {
      timelineMap.set(dayKey, {
        date: dayKey,
        transferCount: 0,
        totalQuantity: 0,
        uniqueProducts: new Set()
      });
    }

    if (!locationMap.has(locationKey)) {
      locationMap.set(locationKey, {
        location,
        transferCount: 0,
        totalQuantity: 0
      });
    }

    const timelineEntry = timelineMap.get(dayKey);
    const locationEntry = locationMap.get(locationKey);

    timelineEntry.transferCount += 1;
    locationEntry.transferCount += 1;

    const products = Array.isArray(transfer?.urunler) ? transfer.urunler : [];
    let transferQuantity = 0;

    products.forEach((urun) => {
      const productId = urun?.id ? String(urun.id) : null;
      const productName = normalizeString(urun?.ad, 'İsimsiz Ürün');
      const category = normalizeString(urun?.kategori, 'Kategori Yok');
      const key = `${locationKey}::${productId || productName}`;
      const amount = Number(urun?.miktar);

      if (Number.isNaN(amount)) {
        return;
      }

      transferQuantity += amount;
      summary.totalQuantity += amount;
      timelineEntry.totalQuantity += amount;
      locationEntry.totalQuantity += amount;
      timelineEntry.uniqueProducts.add(productId || productName);
      productIds.add(productId || productName);

      if (!productMap.has(key)) {
        productMap.set(key, {
          location,
          productId,
          name: productName,
          category,
          totalQuantity: 0,
          transferCount: 0
        });
      }

      const productEntry = productMap.get(key);
      productEntry.totalQuantity += amount;
      productEntry.transferCount += 1;
    });
  });

  summary.distinctProductCount = productIds.size;
  summary.distinctLocationCount = locationKeys.size;
  summary.totalQuantity = Number(summary.totalQuantity.toFixed(2));

  const timeline = [];
  for (let day = actualStart; day <= actualEnd; day += MS_IN_DAY) {
    const dayKey = formatDateKey(day);
    const entry = timelineMap.get(dayKey);
    if (entry) {
      timeline.push({
        date: dayKey,
        transferCount: entry.transferCount,
        totalQuantity: Number(entry.totalQuantity.toFixed(2)),
        distinctProductCount: entry.uniqueProducts.size
      });
    } else {
      timeline.push({
        date: dayKey,
        transferCount: 0,
        totalQuantity: 0,
        distinctProductCount: 0
      });
    }
  }

  const topLocations = Array.from(locationMap.values())
    .map((entry) => ({
      location: entry.location,
      transferCount: entry.transferCount,
      totalQuantity: Number(entry.totalQuantity.toFixed(2))
    }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 10);

  const topProducts = Array.from(productMap.values())
    .map((entry) => ({
      location: entry.location,
      productId: entry.productId,
      name: entry.name,
      category: entry.category,
      totalQuantity: Number(entry.totalQuantity.toFixed(2)),
      transferCount: entry.transferCount
    }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 15);

  const events = filteredTransfers
    .map((transfer) => {
      const timestamp = transfer._timestamp;
      const location = normalizeString(transfer?.hedefKonum);
      const products = Array.isArray(transfer?.urunler) ? transfer.urunler : [];
      const totalQuantity = products.reduce((sum, urun) => {
        const amount = Number(urun?.miktar);
        return Number.isNaN(amount) ? sum : sum + amount;
      }, 0);

      return {
        id: transfer.id || `${timestamp}-${location}`,
        timestamp: new Date(timestamp).toISOString(),
        location,
        productCount: products.length,
        totalQuantity: Number(totalQuantity.toFixed(2)),
        teslimAlan: normalizeString(transfer?.teslimAlan, '-'),
        teslimEden: normalizeString(transfer?.teslimEden, '-'),
        aciklama: normalizeString(transfer?.aciklama || '', '')
      };
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return {
    summary,
    timeline,
    topLocations,
    topProducts,
    events,
    filters: {
      startDate: new Date(actualStart).toISOString(),
      endDate: new Date(actualEnd).toISOString()
    }
  };
}
