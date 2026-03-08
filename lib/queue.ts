import { getSettings } from "@/lib/db";
import { processJob } from "@/lib/generation";

declare global {
  var commerceStudioQueue:
    | {
        active: number;
        pending: string[];
        secrets: Map<string, string | undefined>;
      }
    | undefined;
}

function getQueue() {
  if (!globalThis.commerceStudioQueue) {
    globalThis.commerceStudioQueue = {
      active: 0,
      pending: [],
      secrets: new Map(),
    };
  }

  return globalThis.commerceStudioQueue;
}

async function pumpQueue() {
  const queue = getQueue();
  const { maxConcurrency } = getSettings();

  while (queue.active < maxConcurrency && queue.pending.length > 0) {
    const nextJobId = queue.pending.shift();
    if (!nextJobId) {
      return;
    }

    queue.active += 1;
    const apiKey = queue.secrets.get(nextJobId);

    void processJob(nextJobId, apiKey)
      .catch(() => undefined)
      .finally(() => {
        queue.secrets.delete(nextJobId);
        queue.active -= 1;
        void pumpQueue();
      });
  }
}

export function enqueueJob(jobId: string, overrideApiKey?: string) {
  const queue = getQueue();
  if (!queue.pending.includes(jobId)) {
    queue.pending.push(jobId);
  }
  queue.secrets.set(jobId, overrideApiKey);
  void pumpQueue();
}
