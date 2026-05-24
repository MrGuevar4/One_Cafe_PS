import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = resolve(__dirname, "../config.json");

export interface PrinterConfig {
  name: string;
  type: "tcp" | "printer";
  host?: string;        // for TCP
  port?: number;        // for TCP
  printerName?: string; // for OS printer (Windows/Linux lpd)
  enabled: boolean;
}

export interface AppConfig {
  printers: {
    kitchen: PrinterConfig;
    barista: PrinterConfig;
    shisha: PrinterConfig;
    cashier: PrinterConfig;
  };
  serverPort: number;
}

export function loadConfig(): AppConfig {
  try {
    const raw = readFileSync(CONFIG_PATH, "utf-8");
    return JSON.parse(raw) as AppConfig;
  } catch {
    throw new Error(`Cannot read config at ${CONFIG_PATH}. Ensure config.json exists.`);
  }
}

export function saveConfig(config: AppConfig): void {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}
