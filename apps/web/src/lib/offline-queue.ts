/**
 * Offline Queue Service
 * Manages client-side change queue for offline synchronization
 */

export interface QueuedChange {
  id: string;
  type: string;
  payload: any;
  timestamp: string;
  retryCount: number;
}

const QUEUE_STORAGE_KEY = 'techmate_offline_queue';
const MAX_RETRY_COUNT = 3;

/**
 * Add a change to the offline queue
 */
export function enqueueChange(type: string, payload: any): void {
  const queue = getQueue();
  const change: QueuedChange = {
    id: crypto.randomUUID(),
    type,
    payload,
    timestamp: new Date().toISOString(),
    retryCount: 0,
  };
  
  queue.push(change);
  saveQueue(queue);
}

/**
 * Get all queued changes
 */
export function getQueue(): QueuedChange[] {
  try {
    const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load offline queue:', error);
    return [];
  }
}

/**
 * Save queue to local storage
 */
function saveQueue(queue: QueuedChange[]): void {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Failed to save offline queue:', error);
  }
}

/**
 * Remove a change from the queue
 */
export function dequeueChange(changeId: string): void {
  const queue = getQueue();
  const filtered = queue.filter((change) => change.id !== changeId);
  saveQueue(filtered);
}

/**
 * Increment retry count for a change
 */
export function incrementRetryCount(changeId: string): void {
  const queue = getQueue();
  const updated = queue.map((change) => {
    if (change.id === changeId) {
      return { ...change, retryCount: change.retryCount + 1 };
    }
    return change;
  });
  saveQueue(updated);
}

/**
 * Check if a change has exceeded max retries
 */
export function hasExceededMaxRetries(change: QueuedChange): boolean {
  return change.retryCount >= MAX_RETRY_COUNT;
}

/**
 * Clear the entire queue
 */
export function clearQueue(): void {
  localStorage.removeItem(QUEUE_STORAGE_KEY);
}

/**
 * Sync queued changes with the server
 * Implements last-write-wins conflict resolution
 */
export async function syncQueue(apiClient: any): Promise<{
  synced: number;
  failed: number;
}> {
  const queue = getQueue();
  let synced = 0;
  let failed = 0;

  // Sort by timestamp to ensure last-write-wins
  const sortedQueue = [...queue].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  for (const change of sortedQueue) {
    try {
      // Send change to server
      await apiClient.post('/api/sync/apply', {
        type: change.type,
        payload: change.payload,
        timestamp: change.timestamp,
      });

      // Remove from queue on success
      dequeueChange(change.id);
      synced++;
    } catch (error) {
      console.error(`Failed to sync change ${change.id}:`, error);

      // Increment retry count
      incrementRetryCount(change.id);

      // Remove if exceeded max retries
      if (hasExceededMaxRetries(change)) {
        console.warn(`Change ${change.id} exceeded max retries, removing from queue`);
        dequeueChange(change.id);
      }

      failed++;
    }
  }

  return { synced, failed };
}

/**
 * Check if device is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Set up online/offline event listeners
 */
export function setupOnlineListeners(
  onOnline: () => void,
  onOffline: () => void,
): () => void {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}
