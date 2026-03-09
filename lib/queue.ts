import { getSettings } from "@/lib/db";
import { processJob } from "@/lib/generation";
import type { ProviderOverride } from "@/lib/types";

declare global {
  var commerceStudioQueue:
    | {
        active: number;
        pending: string[];
        overrides: Map<string, ProviderOverride | undefined>;
      }
    | undefined;
}

function getQueue() {
  if (!globalThis.commerceStudioQueue) {
    globalThis.commerceStudioQueue = {
      active: 0,
      pending: [],
      overrides: new Map(),
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
    const providerOverride = queue.overrides.get(nextJobId);

    void processJob(nextJobId, providerOverride)
      .catch(() => undefined)
      .finally(() => {
        queue.overrides.delete(nextJobId);
        queue.active -= 1;
        void pumpQueue();
      });
  }
}

export function enqueueJob(jobId: string, providerOverride?: ProviderOverride) {
  const queue = getQueue();
  if (!queue.pending.includes(jobId)) {
    queue.pending.push(jobId);
  }
  queue.overrides.set(jobId, providerOverride);
  void pumpQueue();
}
