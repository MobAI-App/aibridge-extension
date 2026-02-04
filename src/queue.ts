import { QueuedInjection } from "./types";

const queue: QueuedInjection[] = [];

export function enqueue(text: string, priority: number = 0): number {
  queue.push({ text, priority, timestamp: Date.now() });
  queue.sort((a, b) => b.priority - a.priority || a.timestamp - b.timestamp);
  return queue.length;
}

export function dequeue(): QueuedInjection | undefined {
  return queue.shift();
}

export function clear(): void {
  queue.length = 0;
}

export function length(): number {
  return queue.length;
}
