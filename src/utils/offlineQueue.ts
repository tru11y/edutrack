const QUEUE_KEY = "edutrack_offline_queue";

export interface QueuedOperation {
  id: string;
  functionName: string;
  data: unknown;
  timestamp: number;
}

function getQueue(): QueuedOperation[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedOperation[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // localStorage full
  }
}

export function enqueueOperation(functionName: string, data: unknown): void {
  const queue = getQueue();
  queue.push({
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    functionName,
    data,
    timestamp: Date.now(),
  });
  saveQueue(queue);
}

export function getQueueLength(): number {
  return getQueue().length;
}

export async function processQueue(
  executor: (name: string, data: unknown) => Promise<unknown>
): Promise<{ processed: number; failed: number }> {
  const queue = getQueue();
  if (queue.length === 0) return { processed: 0, failed: 0 };

  let processed = 0;
  let failed = 0;
  const remaining: QueuedOperation[] = [];

  for (const op of queue) {
    try {
      await executor(op.functionName, op.data);
      processed++;
    } catch {
      failed++;
      remaining.push(op);
    }
  }

  saveQueue(remaining);
  return { processed, failed };
}

export function clearQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}
