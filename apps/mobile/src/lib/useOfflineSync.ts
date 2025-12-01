import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { OfflineQueue, QueuedRequest } from './offline-queue';
import { api } from './api';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [queueSize, setQueueSize] = useState(0);

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected && state.isInternetReachable !== false;
      setIsOnline(online);
      
      if (online && !isSyncing) {
        syncQueue();
      }
    });

    // Initial queue size check
    updateQueueSize();

    return () => unsubscribe();
  }, []);

  const updateQueueSize = async () => {
    const size = await OfflineQueue.size();
    setQueueSize(size);
  };

  const syncQueue = async () => {
    setIsSyncing(true);
    
    try {
      const queue = await OfflineQueue.getQueue();
      
      for (const request of queue) {
        try {
          await executeRequest(request);
          await OfflineQueue.remove(request.id);
        } catch (error) {
          console.error('Failed to sync request:', error);
          // Keep request in queue for retry
        }
      }
      
      await updateQueueSize();
    } catch (error) {
      console.error('Error syncing queue:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const executeRequest = async (request: QueuedRequest) => {
    switch (request.method) {
      case 'GET':
        return api.get(request.url);
      case 'POST':
        return api.post(request.url, request.data);
      case 'PUT':
        return api.put(request.url, request.data);
      case 'DELETE':
        return api.delete(request.url);
      default:
        throw new Error(`Unsupported method: ${request.method}`);
    }
  };

  const queueRequest = async (
    method: QueuedRequest['method'],
    url: string,
    data?: any
  ) => {
    await OfflineQueue.add({ method, url, data });
    await updateQueueSize();
  };

  return {
    isOnline,
    isSyncing,
    queueSize,
    syncQueue,
    queueRequest,
  };
}
