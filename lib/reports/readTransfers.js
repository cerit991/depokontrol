import fs from 'fs';
import path from 'path';

const transferDbPath = path.join(process.cwd(), 'data', 'transfers.json');

export function readTransfers() {
  try {
    if (!fs.existsSync(transferDbPath)) {
      return [];
    }

    const raw = fs.readFileSync(transferDbPath, 'utf8');
    const parsed = JSON.parse(raw || '{}');

    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.transfers)) {
      return [];
    }

    return parsed.transfers;
  } catch (error) {
    console.error('Transfer verisi okunamadı:', error);
    return [];
  }
}
