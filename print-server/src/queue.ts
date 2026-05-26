type TaskFn = () => Promise<void>;

class PrinterQueue {
  private queue: TaskFn[] = [];
  private processing = false;

  async add(task: TaskFn): Promise<void> {
    if (this.queue.length >= 2) {
      return Promise.reject(new Error("مەکینەی چاپکردن وەڵام ناداتەوە (Offline/Blocked)"));
    }
    return new Promise<void>((resolve, reject) => {
      this.queue.push(async () => {
        let timer: any;
        const timeoutPromise = new Promise<never>((_, rej) => {
          timer = setTimeout(() => rej(new Error("کاتی چاپکردن بەسەرچوو (Timeout)")), 15000);
        });

        try {
          await Promise.race([task(), timeoutPromise]);
          clearTimeout(timer);
          resolve();
        } catch (err) {
          clearTimeout(timer);
          reject(err);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    const task = this.queue.shift();
    if (task) {
      try {
        await task();
      } catch (err) {
        // Handled in add()'s catch block
      }
    }
    this.processing = false;
    this.process();
  }
}

// A dedicated FIFO queue for each physical print station
const queues: Record<string, PrinterQueue> = {
  kitchen: new PrinterQueue(),
  barista: new PrinterQueue(),
  shisha: new PrinterQueue(),
  cashier: new PrinterQueue(),
};

export async function enqueuePrintJob(
  printerKey: "kitchen" | "barista" | "shisha" | "cashier",
  task: TaskFn
): Promise<void> {
  const queue = queues[printerKey];
  if (!queue) {
    throw new Error(`Queue not found for printer key: ${printerKey}`);
  }
  return queue.add(task);
}
