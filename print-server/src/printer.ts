import ThermalPrinter from "node-thermal-printer";
import { type PrinterConfig } from "./config.js";

const { printer: Printer, types: PrinterTypes } = ThermalPrinter;

export interface PrinterStatus {
  name: string;
  connected: boolean;
  error?: string;
}

/**
 * Build a ThermalPrinter instance from config.
 * Uses TCP for network printers — works identically on Linux and Windows.
 */
function buildPrinter(cfg: PrinterConfig): InstanceType<typeof Printer> {
  if (cfg.type === "tcp") {
    return new Printer({
      type: PrinterTypes.EPSON,
      interface: `tcp://${cfg.host}:${cfg.port ?? 9100}`,
      characterSet: "ARABIC",
      width: 42,
      options: {
        timeout: 3000,
      },
    });
  }
  // OS printer fallback (works on both Windows \\server\printer and Linux /dev/usb/lp0)
  return new Printer({
    type: PrinterTypes.EPSON,
    interface: cfg.printerName ?? "/dev/usb/lp0",
    characterSet: "ARABIC",
    width: 42,
    options: {
      timeout: 3000,
    },
  });
}

export async function checkPrinterStatus(cfg: PrinterConfig): Promise<PrinterStatus> {
  if (!cfg.enabled) {
    return { name: cfg.name, connected: false, error: "Disabled" };
  }
  try {
    const p = buildPrinter(cfg);
    const isConnected = await p.isPrinterConnected();
    return { name: cfg.name, connected: isConnected };
  } catch (err) {
    return { name: cfg.name, connected: false, error: String(err) };
  }
}

export interface PrintLineItem {
  qty: number;
  name: string;
  price: number;
  category: string;
}

export interface PrintJobPayload {
  type: "kitchen" | "barista" | "shisha" | "cashier" | "full";
  orderNumber: number;
  tableLabel: string;
  lines: PrintLineItem[];
  subtotal?: number;
  tax?: number;
  total?: number;
  timestamp: string;
  sessionId?: string;
  note?: string;
}

/**
 * Print a preparation station ticket (Kitchen, Barista, Shisha).
 * Utilizes bold double-height/width text for quantities and table numbers so staff can read easily.
 */
export async function printPreparationTicket(
  cfg: PrinterConfig,
  stationName: string,
  payload: PrintJobPayload,
  lines: PrintLineItem[]
): Promise<void> {
  if (!cfg.enabled) return;
  const p = buildPrinter(cfg);

  // Trigger printer buzzer/beep (2 beeps) to alert preparation staff
  p.beep(2, 100);

  // Header
  p.alignCenter();
  p.bold(true);
  p.setTextNormal();
  p.println("ONE Cafe & Restaurant");
  p.bold(false);
  p.println(new Date(payload.timestamp).toLocaleString("ku-IQ"));
  p.drawLine();

  // Print preparation station header (double width & height)
  p.alignCenter();
  p.setTextQuadArea();
  p.bold(true);
  p.println(stationName);
  p.setTextNormal();
  p.bold(false);
  p.drawLine();

  p.alignCenter();
  p.setTextQuadArea();
  p.bold(true);
  p.println(`مێز: ${payload.tableLabel}`);
  p.println(`داواکاری #${payload.orderNumber}`);
  p.setTextNormal();
  p.bold(false);
  p.drawLine();

  if (payload.note) {
    p.drawLine();
    p.bold(true);
    p.println(`تێبینی: ${payload.note}`);
    p.bold(false);
    p.drawLine();
  }

  // Print line items
  p.alignRight();
  for (const line of lines) {
    // Quantity: Double width & height, bold
    p.setTextQuadArea();
    p.bold(true);
    p.println(`- ${line.qty}x -`);
    
    // Item Name: Normal size, bold
    p.setTextNormal();
    p.bold(true);
    p.println(`  ${line.name}`);
    p.bold(false);
    p.drawLine("-");
  }

  p.cut();

  await p.execute();
}

/**
 * Print a customer cashier receipt (full combined receipt).
 */
export async function printCashierReceipt(
  cfg: PrinterConfig,
  payload: PrintJobPayload,
  lines: PrintLineItem[]
): Promise<void> {
  if (!cfg.enabled) return;
  const p = buildPrinter(cfg);

  // Trigger brief beep to alert cashier
  p.beep(1, 100);

  p.alignCenter();
  p.bold(true);
  p.setTextNormal();
  p.println("ONE Cafe & Restaurant");
  p.bold(false);
  p.println(new Date(payload.timestamp).toLocaleString("ku-IQ"));
  p.drawLine();

  p.alignCenter();
  p.bold(true);
  p.println("** پسووڵە **");
  p.bold(false);
  p.drawLine();

  p.alignRight();
  p.println(`ژمارەی داواکاری: ${payload.orderNumber}`);
  p.println(`مێز: ${payload.tableLabel}`);
  p.drawLine();

  if (payload.note) {
    p.drawLine();
    p.bold(true);
    p.println(`تێبینی: ${payload.note}`);
    p.bold(false);
    p.drawLine();
  }

  for (const line of lines) {
    p.alignRight();
    p.println(`${line.qty}x ${line.name}`);
    p.alignLeft();
    p.println(`${(line.price * line.qty).toLocaleString()} دینار`);
    p.drawLine("-");
  }

  p.drawLine();
  p.alignRight();
  p.println(`کۆی گشتی: ${(payload.subtotal ?? 0).toLocaleString()} دینار`);
  if (payload.tax && payload.tax > 0) {
    p.println(`باج: ${payload.tax.toLocaleString()} دینار`);
  }
  p.bold(true);
  p.println(`کۆی کۆتایی: ${(payload.total ?? 0).toLocaleString()} دینار`);
  p.bold(false);

  p.drawLine();
  p.alignCenter();
  p.println("سوپاس بۆ سەردانەکەتان!");
  p.cut();

  await p.execute();
}
