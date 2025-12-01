import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { OfflineQueue } from './offline-queue';
import { LocalStorage } from './storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Check network connectivity for mutations
  if (config.method && ['post', 'put', 'delete'].includes(config.method.toLowerCase())) {
    const netInfo = await NetInfo.fetch();
    const isOnline = netInfo.isConnected && netInfo.isInternetReachable !== false;
    
    if (!isOnline) {
      // Queue the request for later
      await OfflineQueue.add({
        method: config.method.toUpperCase() as any,
        url: config.url || '',
        data: config.data,
      });
      
      // Return a mock response
      return Promise.reject({
        isOffline: true,
        message: 'Request queued for sync when online',
      });
    }
  }
  
  return config;
});

// Response interceptor for error handling and caching
api.interceptors.response.use(
  async (response) => {
    // Cache GET responses
    if (response.config.method === 'get' && response.config.url) {
      await LocalStorage.cacheData(response.config.url, response.data);
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
    }
    
    // Try to return cached data for GET requests when offline
    if (error.config?.method === 'get' && error.config.url) {
      const cachedData = await LocalStorage.getCachedData(error.config.url);
      if (cachedData) {
        return {
          data: cachedData,
          status: 200,
          statusText: 'OK (Cached)',
          headers: {},
          config: error.config,
        };
      }
    }
    
    return Promise.reject(error);
  }
);
