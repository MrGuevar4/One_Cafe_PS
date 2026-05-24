type TaskFn = () => Promise<void>;

class PrinterQueue {
  private queue: TaskFn[] = [];
  private processing = false;

  async add(task: TaskFn): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          await task();
          resolve();
        } catch (err) {
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
