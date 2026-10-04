import { mkdir, readFile, writeFile, rmdir } from 'node:fs/promises';
import path from 'node:path';

async function withLedger(directory, scope, operation) {
  if (!/^[a-zA-Z0-9-]+$/.test(scope)) throw new Error('Build scope must be filesystem safe.');
  await mkdir(directory, { recursive: true });
  const lock = path.join(directory, `${scope}.lock`);
  for (let attempt = 0; ; attempt++) {
    try { await mkdir(lock); break; }
    catch (error) {
      if (error.code !== 'EEXIST' || attempt > 100) throw error;
      await new Promise(resolve => setTimeout(resolve, 30));
    }
  }
  try {
    const file = path.join(directory, `${scope}.json`);
    let ledger;
    try { ledger = JSON.parse(await readFile(file, 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; ledger = { scope, lastOrdinal: 0, attempts: [] }; }
    const result = operation(ledger);
    await writeFile(file, JSON.stringify(ledger, null, 2) + '\n');
    return result;
  } finally { await rmdir(lock); }
}

export async function reserveOrdinal(directory, scope) {
  return withLedger(directory, scope, ledger => {
    const ordinal = ++ledger.lastOrdinal;
    ledger.attempts.push({ ordinal, reservedAt: new Date().toISOString(), status: 'reserved' });
    return ordinal;
  });
}

export async function completeReservation(directory, scope, ordinal, update) {
  return withLedger(directory, scope, ledger => {
    const attempt = ledger.attempts.find(item => item.ordinal === ordinal);
    if (!attempt) throw new Error('No matching build reservation.');
    Object.assign(attempt, update, { completedAt: new Date().toISOString() });
  });
}
