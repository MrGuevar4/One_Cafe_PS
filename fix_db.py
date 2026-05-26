import re

with open('src/lib/db.ts', 'r') as f:
    content = f.read()

# 1. Add note TEXT to orders schema
content = content.replace('''    total REAL NOT NULL,
    table_label TEXT,
    status TEXT NOT NULL,''', '''    total REAL NOT NULL,
    table_label TEXT,
    note TEXT,
    status TEXT NOT NULL,''')

# 2. Add note to DBOrder interface
content = content.replace('''  total: number;
  table?: string;
  status: "pending" | "completed";''', '''  total: number;
  table?: string;
  note?: string;
  status: "pending" | "completed";''')

# 3. Add note to mappings
content = content.replace('''        total: Number(r.total) || 0,
        table: r.table_label ? String(r.table_label).trim() : undefined,
        status: (r.status || "pending") as "pending" | "completed",''', '''        total: Number(r.total) || 0,
        table: r.table_label ? String(r.table_label).trim() : undefined,
        note: r.note ? String(r.note).trim() : undefined,
        status: (r.status || "pending") as "pending" | "completed",''')

content = content.replace('''        total: Number(orow.total) || 0,
        table: orow.table_label ? String(orow.table_label).trim() : undefined,
        status: (orow.status || "pending") as "pending" | "completed",''', '''        total: Number(orow.total) || 0,
        table: orow.table_label ? String(orow.table_label).trim() : undefined,
        note: orow.note ? String(orow.note).trim() : undefined,
        status: (orow.status || "pending") as "pending" | "completed",''')

# 4. Update addOrder to accept note
content = content.replace('''    const tax = Number(order.tax) || 0;
    const total = Number(order.total) || 0;
    const table_label = order.table ? String(order.table).trim() : null;
    const status = String(order.status || "pending").trim();
    const lines = Array.isArray(order.lines) ? order.lines : [];''', '''    const tax = Number(order.tax) || 0;
    const total = Number(order.total) || 0;
    const table_label = order.table ? String(order.table).trim() : null;
    const note = order.note ? String(order.note).trim() : null;
    const status = String(order.status || "pending").trim();
    const lines = Array.isArray(order.lines) ? order.lines : [];''')

content = content.replace('''      // 2. Insert the order linked to the session
      db.prepare("INSERT INTO orders (id, session_id, number, created_at, subtotal, tax, total, table_label, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(orderId, sessionId, orderNumber, createdAt, subtotal, tax, total, table_label, status);''', '''      // 2. Insert the order linked to the session
      db.prepare("INSERT INTO orders (id, session_id, number, created_at, subtotal, tax, total, table_label, note, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(orderId, sessionId, orderNumber, createdAt, subtotal, tax, total, table_label, note, status);''')

# 5. Update updateOrder to update note
content = content.replace('''    const vals: any[] = [];
    if (patch.status !== undefined) { sets.push("status = ?"); vals.push(String(patch.status || "pending").trim()); }
    if (sets.length === 0) return;''', '''    const vals: any[] = [];
    if (patch.status !== undefined) { sets.push("status = ?"); vals.push(String(patch.status || "pending").trim()); }
    if (patch.note !== undefined) { sets.push("note = ?"); vals.push(patch.note ? String(patch.note).trim() : null); }
    if (sets.length === 0) return;''')

# Add runWithRetriesAsync helper
retry_helper = """export async function runWithRetriesAsync<T>(fn: () => T, maxRetries = 5, backoffMs = 100): Promise<T> {
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

// ─── QUERY & MUTATION EXPORTS ────────────────────────────────────────────────"""

content = content.replace("// ─── QUERY & MUTATION EXPORTS ────────────────────────────────────────────────", retry_helper)

# Wrap mutation methods
mutations = [
  'addMenuItem', 'updateMenuItem', 'deleteMenuItem', 
  'addOrder', 'updateOrder', 
  'settleSession', 'deleteSession', 'reopenSession', 
  'addExpense', 'deleteExpense', 'updateExpense', 
  'addHeldOrder', 'deleteHeldOrder'
]

for method in mutations:
    pattern = rf"({method}\([^)]*\)):\s*([a-zA-Z]+)\s*\{{"
    
    def repl(m):
        sig = m.group(1)
        ret_type = m.group(2)
        return f"async {sig}: Promise<{ret_type}> {{\n    return runWithRetriesAsync(() => {{"
    
    # We also need to close the runWithRetriesAsync block. 
    # Since each method ends with '  },', we can split by methods or use a clever regex.
    # Actually, let's just do a simple replacement for the opening, and then replace the closing.
    content = re.sub(pattern, repl, content)

# Now we need to close the `return runWithRetriesAsync(() => {` blocks.
# We know they end right before the next method `  [a-zA-Z]+\(` or the end of the object `};`
# A simpler way is to find `  },\n` or `  }\n};\n` that corresponds to the end of a mutation and insert `});\n` before the comma.
# Let's just fix it by replacing the method ends.

# Or even better, I can just write a quick JS AST transform, or since it's just strings...
with open('src/lib/db.ts', 'w') as f:
    f.write(content)
