import { Worker } from "worker_threads";
import path from "path";

const isTs = import.meta.filename.endsWith(".ts");
console.log(
  `[WorkerPool] Initializing. isTs=${isTs}, filename=${import.meta.filename}`,
);
const workerExtension = isTs ? ".ts" : ".js";

// Determine the path to the worker file.
// In dev (TS): ../workers/snapshot.worker.ts (relative to src/utils/)
// In prod (JS): ./workers/snapshot.worker.js (relative to dist/)
const relativePath = isTs
  ? "../workers/snapshot.worker"
  : "./workers/snapshot.worker";
const workerPath = path.resolve(
  import.meta.dirname,
  `${relativePath}${workerExtension}`,
);

interface Task<TInput, TOutput> {
  data: TInput;
  resolve: (value: TOutput) => void;
  reject: (reason?: unknown) => void;
}

type WorkerResponse<T> =
  | { success: true; data: T }
  | { success: false; error: unknown };

export class WorkerPool<TInput, TOutput> {
  private workers: Worker[] = [];
  private idleWorkers: Worker[] = [];
  private taskQueue: Task<TInput, TOutput>[] = [];
  private workerMap = new Map<number, Task<TInput, TOutput>>();

  constructor(private size: number) {
    for (let i = 0; i < size; i++) {
      this.addWorker();
    }
  }

  private addWorker() {
    const worker = new Worker(workerPath, {
      execArgv: isTs ? ["--import", "tsx/esm"] : undefined,
    });

    worker.on("message", (message: unknown) => {
      const result = message as WorkerResponse<TOutput>;
      const task = this.workerMap.get(worker.threadId);
      if (task) {
        this.workerMap.delete(worker.threadId);
        if (result.success) {
          task.resolve(result.data);
        } else {
          task.reject(result.error);
        }
      }
      this.idleWorkers.push(worker);
      this.processQueue();
    });

    worker.on("error", (err) => {
      const task = this.workerMap.get(worker.threadId);
      if (task) {
        this.workerMap.delete(worker.threadId);
        task.reject(err);
      }
      console.error("Worker error:", err);
      this.workers = this.workers.filter((w) => w !== worker);
      this.addWorker();
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        // console.error(`Worker stopped with exit code ${code}`);
        // If checking map here, we might find abandoned tasks?
        const task = this.workerMap.get(worker.threadId);
        if (task) {
          this.workerMap.delete(worker.threadId);
          task.reject(new Error(`Worker stopped with exit code ${code}`));
        }
      }
    });

    this.workers.push(worker);
    this.idleWorkers.push(worker);
  }

  public run(data: TInput): Promise<TOutput> {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({ data, resolve, reject });
      this.processQueue();
    });
  }

  private processQueue() {
    if (this.taskQueue.length === 0 || this.idleWorkers.length === 0) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const worker = this.idleWorkers.shift()!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const task = this.taskQueue.shift()!;
    this.workerMap.set(worker.threadId, task);
    worker.postMessage(task.data);
  }

  public async terminate() {
    await Promise.all(this.workers.map((w) => w.terminate()));
  }
}
