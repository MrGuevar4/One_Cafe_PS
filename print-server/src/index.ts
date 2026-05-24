import express from "express";
import cors from "cors";
import { loadConfig, saveConfig } from "./config.js";
import { checkPrinterStatus } from "./printer.js";
import { routePrintJob, type PrintJobPayload } from "./router.js";

const app = express();

// Allow requests from any origin in local LAN environment
app.use(cors({ origin: '*' }));
app.use(express.json());

// ─── Health / Printer Status ──────────────────────────────────────────────────
app.get("/api/status", async (_req, res) => {
  const config = loadConfig();
  const [kitchen, barista, shisha, cashier] = await Promise.all([
    checkPrinterStatus(config.printers.kitchen),
    checkPrinterStatus(config.printers.barista),
    checkPrinterStatus(config.printers.shisha),
    checkPrinterStatus(config.printers.cashier),
  ]);
  res.json({ kitchen, barista, shisha, cashier, serverRunning: true });
});

// ─── Print Job ────────────────────────────────────────────────────────────────
app.post("/api/print", async (req, res) => {
  const config = loadConfig();
  const payload = req.body as PrintJobPayload;

  if (!payload || !payload.lines) {
    res.status(400).json({ error: "Invalid payload: missing lines" });
    return;
  }

  const result = await routePrintJob(config, payload);

  if (result.errors.length > 0 && result.routed.length === 0) {
    res.status(500).json({ error: "All printers failed", details: result.errors });
  } else {
    res.json({
      success: true,
      routed: result.routed,
      warnings: result.errors.length > 0 ? result.errors : undefined,
    });
  }
});

// ─── Config Management ────────────────────────────────────────────────────────
app.get("/api/config", (_req, res) => {
  const config = loadConfig();
  res.json(config);
});

app.put("/api/config", (req, res) => {
  try {
    const incoming = req.body;
    saveConfig(incoming);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
const config = loadConfig();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : config.serverPort ?? 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`ONE Cafe Print Server running on http://0.0.0.0:${PORT}`);
  console.log(`Status: http://0.0.0.0:${PORT}/api/status`);
});
