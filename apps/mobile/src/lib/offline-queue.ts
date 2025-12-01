import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QueuedRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  data?: any;
  timestamp: number;
}

const QUEUE_KEY = '@offline_queue';

export class OfflineQueue {
  static async add(request: Omit<QueuedRequest, 'id' | 'timestamp'>): Promise<void> {
    const queue = await this.getQueue();
    const newRequest: QueuedRequest = {
      ...request,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    queue.push(newRequest);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }

  static async getQueue(): Promise<QueuedRequest[]> {
    try {
      const queueJson = await AsyncStorage.getItem(QUEUE_KEY);
      return queueJson ? JSON.parse(queueJson) : [];
    } catch (error) {
      console.error('Error reading offline queue:', error);
      return [];
    }
  }

  static async remove(id: string): Promise<void> {
    const queue = await this.getQueue();
    const filtered = queue.filter(req => req.id !== id);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  }

  static async clear(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_KEY);
  }

  static async size(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }
}
