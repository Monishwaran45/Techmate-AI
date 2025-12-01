import AsyncStorage from '@react-native-async-storage/async-storage';

export class LocalStorage {
  static async set(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Error saving to local storage:', error);
    }
  }

  static async get<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error reading from local storage:', error);
      return null;
    }
  }

  static async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from local storage:', error);
    }
  }

  static async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing local storage:', error);
    }
  }

  // Cache management
  static async cacheData(key: string, data: any, ttl?: number): Promise<void> {
    const cacheItem = {
      data,
      timestamp: Date.now(),
      ttl: ttl || 3600000, // Default 1 hour
    };
    await this.set(key, cacheItem);
  }

  static async getCachedData<T>(key: string): Promise<T | null> {
    const cacheItem = await this.get<{
      data: T;
      timestamp: number;
      ttl: number;
    }>(key);

    if (!cacheItem) return null;

    const isExpired = Date.now() - cacheItem.timestamp > cacheItem.ttl;
    if (isExpired) {
      await this.remove(key);
      return null;
    }

    return cacheItem.data;
  }
}
