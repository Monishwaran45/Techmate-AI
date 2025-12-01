import { useEffect, useState, useCallback } from 'react';
import {
  enqueueChange,
  syncQueue,
  isOnline,
  setupOnlineListeners,
  getQueue,
} from './offline-queue';
import { api } from './api';

/**
 * React hook for managing offline synchronization
 */
export function useOfflineSync() {
  const [online, setOnline] = useState(isOnline());
  const [syncing, setSyncing] = useState(false);
  const [queueSize, setQueueSize] = useState(0);

  // Update queue size
  const updateQueueSize = useCallback(() => {
    setQueueSize(getQueue().length);
  }, []);

  // Sync queued changes
  const sync = useCallback(async () => {
    if (!online || syncing) {
      return;
    }

    setSyncing(true);
    try {
      const result = await syncQueue(api);
      console.log(`Synced ${result.synced} changes, ${result.failed} failed`);
      updateQueueSize();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  }, [online, syncing, updateQueueSize]);

  // Queue a change (for offline or online mode)
  const queueChange = useCallback(
    (type: string, payload: any) => {
      enqueueChange(type, payload);
      updateQueueSize();

      // If online, sync immediately
      if (online && !syncing) {
        sync();
      }
    },
    [online, syncing, sync, updateQueueSize],
  );

  // Set up online/offline listeners
  useEffect(() => {
    const cleanup = setupOnlineListeners(
      () => {
        setOnline(true);
        // Sync when coming back online
        sync();
      },
      () => {
        setOnline(false);
      },
    );

    // Initial queue size
    updateQueueSize();

    return cleanup;
  }, [sync, updateQueueSize]);

  return {
    online,
    syncing,
    queueSize,
    queueChange,
    sync,
  };
}
