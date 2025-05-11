import { Collection, Document } from "mongodb";

const batchSize = 10;
const timeoutMs = 5000;

export class MessageBuffer {
  private buffer: Document[] = [];
  private timer: NodeJS.Timeout | null = null;

  constructor(private collection: Collection) {}

  push(doc: Document) {
    this.buffer.push(doc);

    if (this.buffer.length >= batchSize) this.flushSoon(0);
    else if (!this.timer) this.flushSoon(timeoutMs);
  }

  async flush(): Promise<void> {
    if (!this.buffer.length) return;

    const payload = this.buffer.splice(0);

    await this.collection.insertMany(payload, { ordered: false });
  }

  private flushSoon(delay: number) {
    if (this.timer) clearTimeout(this.timer);

    this.timer = setTimeout(async () => {
      this.timer = null;
      await this.flush().catch(console.error);
    }, delay);
  }
}
