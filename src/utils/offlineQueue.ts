const QUEUE_KEY = "edutrack_offline_queue";
const MAX_QUEUE_SIZE = 100;

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

function saveQueue(queue: QueuedOperation[]): boolean {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return true;
  } catch {
    return false;
  }
}

/**
 * Ajoute une opération à la queue offline.
 * Retourne false si la queue est pleine ou si le stockage est indisponible.
 */
export function enqueueOperation(functionName: string, data: unknown): boolean {
  const queue = getQueue();

  if (queue.length >= MAX_QUEUE_SIZE) {
    // Queue pleine — on ne perd pas de données silencieusement
    return false;
  }

  queue.push({
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    functionName,
    data,
    timestamp: Date.now(),
  });

  return saveQueue(queue);
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
