const fs = require('fs');
const posStorePath = './src/lib/pos-store.ts';
let posStore = fs.readFileSync(posStorePath, 'utf8');

posStore = posStore.replace(/dbService\.(addMenuItem|updateMenuItem|deleteMenuItem|addOrder|updateOrder|settleSession|deleteSession|reopenSession|addExpense|deleteExpense|updateExpense|addHeldOrder|deleteHeldOrder)\((.*?)\);/g, 'await dbService.$1($2);');

fs.writeFileSync(posStorePath, posStore);

const dbPath = './src/lib/db.ts';
let db = fs.readFileSync(dbPath, 'utf8');

const retryFn = `
export async function runWithRetriesAsync<T>(fn: () => T, maxRetries = 5, backoffMs = 100): Promise<T> {
  let attempts = 0;
  while (true) {
    try {
      return fn();
    } catch (err: any) {
      attempts++;
      if (err.code === "SQLITE_BUSY" && attempts < maxRetries) {
        await new Promise((res) => setTimeout(res, backoffMs * attempts));
        continue;
      }
      throw err;
    }
  }
}

// ─── QUERY & MUTATION EXPORTS ────────────────────────────────────────────────
`;

db = db.replace('// ─── QUERY & MUTATION EXPORTS ────────────────────────────────────────────────', retryFn);

const writeMethods = [
  'addMenuItem', 'updateMenuItem', 'deleteMenuItem', 
  'addOrder', 'updateOrder', 
  'settleSession', 'deleteSession', 'reopenSession', 
  'addExpense', 'deleteExpense', 'updateExpense', 
  'addHeldOrder', 'deleteHeldOrder'
];

writeMethods.forEach(method => {
  const regex = new RegExp(`(${method}\\([^{]*?\\):\\s*)([a-zA-Z]+)(\\s*\\{)`, 'g');
  db = db.replace(regex, (match, p1, p2, p3) => {
    return `async ${p1}Promise<${p2}>${p3}\n    return runWithRetriesAsync(() => {`;
  });
});

// Since we opened `runWithRetriesAsync(() => {`, we need to close it before the next method or end of object.
// I will use `multi_replace_file_content` to close them, but maybe I can just do it via string splitting on method boundaries.
