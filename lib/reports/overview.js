import { readTransfers } from './readTransfers.js';

export function buildOverviewReport() {
  const transfers = readTransfers();

  if (!Array.isArray(transfers) || transfers.length === 0) {
    return {
      totalTransfers: 0,
      totalItemsDelivered: 0,
      distinctProductCount: 0,
      firstTransferDate: null,
      lastTransferDate: null,
      averageItemsPerTransfer: 0,
      deliveredToBar: 0
    };
  }

  let totalItems = 0;
  let totalDeliveredToBar = 0;
  const productIds = new Set();
  const timestamps = [];

  transfers.forEach((transfer) => {
    const transferDate = new Date(transfer.olusturmaTarihi);
    const transferTime = transferDate.getTime();
    if (!Number.isNaN(transferTime)) {
      timestamps.push(transferTime);
    }

    if (!Array.isArray(transfer.urunler)) {
      return;
    }

    transfer.urunler.forEach((urun) => {
      const amount = Number(urun?.miktar);
      if (!Number.isNaN(amount)) {
        totalItems += amount;
        const locationName = transfer?.hedefKonum ? String(transfer.hedefKonum).toLowerCase() : '';
        if (locationName === 'bar') {
          totalDeliveredToBar += amount;
        }
      }

      if (urun?.id) {
        productIds.add(String(urun.id));
      }
    });
  });

  const firstTransfer = timestamps.length ? new Date(Math.min(...timestamps)).toISOString() : null;
  const lastTransfer = timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null;

  return {
    totalTransfers: transfers.length,
    totalItemsDelivered: Number(totalItems.toFixed(2)),
    distinctProductCount: productIds.size,
    firstTransferDate: firstTransfer,
    lastTransferDate: lastTransfer,
    averageItemsPerTransfer: Number((totalItems / transfers.length).toFixed(2)),
    deliveredToBar: Number(totalDeliveredToBar.toFixed(2))
  };
}
