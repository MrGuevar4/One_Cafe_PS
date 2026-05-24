import {
  type PrintJobPayload,
  type PrintLineItem,
  printPreparationTicket,
  printCashierReceipt,
} from "./printer.js";
import { type AppConfig } from "./config.js";
import { enqueuePrintJob } from "./queue.js";

/**
 * Route print lines to the correct printers based on category.
 * Matches both English categories and their Kurdish localized equivalents.
 *
 * - Fast Food ("خواردنی خێرا") -> Kitchen printer
 * - Hot Drinks ("خواردنەوەی گەرم") / Cold Drinks ("خواردنەوەی سارد") -> Barista printer
 * - Shisha ("نێرگەلە") -> Shisha printer
 * - Cashier: full receipt printing
 */
export async function routePrintJob(
  config: AppConfig,
  payload: PrintJobPayload
): Promise<{ routed: string[]; errors: string[] }> {
  const routed: string[] = [];
  const errors: string[] = [];

  const kitchenLines = payload.lines.filter(
    (l) => l.category === "Fast Food" || l.category === "خواردنی خێرا"
  );
  const baristaLines = payload.lines.filter(
    (l) =>
      l.category === "Hot Drinks" ||
      l.category === "خواردنەوەی گەرم" ||
      l.category === "Cold Drinks" ||
      l.category === "خواردنەوەی سارد"
  );
  const shishaLines = payload.lines.filter(
    (l) => l.category === "Shisha" || l.category === "نێرگەلە"
  );

  const printPromises: Promise<void>[] = [];

  // 1. Kitchen Printer (Fast Food)
  if (kitchenLines.length > 0 && config.printers.kitchen?.enabled) {
    printPromises.push(
      enqueuePrintJob("kitchen", async () => {
        try {
          await printPreparationTicket(
            config.printers.kitchen,
            "** داواکاری چێشتخانە **",
            payload,
            kitchenLines
          );
          routed.push("kitchen");
        } catch (err) {
          const errMsg = `چاپکەری چێشتخانە کار ناکات: ${String(err)}`;
          errors.push(errMsg);
          throw new Error(errMsg); // Rethrow to reject enqueue promise and log failure
        }
      })
    );
  }

  // 2. Barista Printer (Beverages)
  if (baristaLines.length > 0 && config.printers.barista?.enabled) {
    printPromises.push(
      enqueuePrintJob("barista", async () => {
        try {
          await printPreparationTicket(
            config.printers.barista,
            "** داواکاری بارێستا **",
            payload,
            baristaLines
          );
          routed.push("barista");
        } catch (err) {
          const errMsg = `چاپکەری بارێستا کار ناکات: ${String(err)}`;
          errors.push(errMsg);
          throw new Error(errMsg);
        }
      })
    );
  }

  // 3. Shisha Printer (Hookah)
  if (shishaLines.length > 0 && config.printers.shisha?.enabled) {
    printPromises.push(
      enqueuePrintJob("shisha", async () => {
        try {
          await printPreparationTicket(
            config.printers.shisha,
            "** داواکاری نێرگەلە **",
            payload,
            shishaLines
          );
          routed.push("shisha");
        } catch (err) {
          const errMsg = `چاپکەری نێرگەلە کار ناکات: ${String(err)}`;
          errors.push(errMsg);
          throw new Error(errMsg);
        }
      })
    );
  }

  // 4. Cashier Printer (Receipt)
  if ((payload.type === "cashier" || payload.type === "full") && config.printers.cashier?.enabled) {
    printPromises.push(
      enqueuePrintJob("cashier", async () => {
        try {
          await printCashierReceipt(
            config.printers.cashier,
            payload,
            payload.lines
          );
          routed.push("cashier");
        } catch (err) {
          const errMsg = `چاپکەری کاشێر کار ناکات: ${String(err)}`;
          errors.push(errMsg);
          throw new Error(errMsg);
        }
      })
    );
  }

  // Wait for all print jobs of the current request to complete (or fail) from their queues
  await Promise.allSettled(printPromises);

  return { routed, errors };
}

export type { PrintJobPayload, PrintLineItem };
