import { View, Text } from 'react-native';
import { useOfflineSync } from '../lib/useOfflineSync';

export function SyncIndicator() {
  const { isOnline, isSyncing, queueSize } = useOfflineSync();

  if (isOnline && !isSyncing && queueSize === 0) {
    return null;
  }

  return (
    <View className="bg-gray-900 px-4 py-2">
      {!isOnline && (
        <View className="flex-row items-center justify-center">
          <View className="w-2 h-2 rounded-full bg-red-500 mr-2" />
          <Text className="text-white text-sm">
            Offline {queueSize > 0 ? `• ${queueSize} pending` : ''}
          </Text>
        </View>
      )}
      
      {isOnline && isSyncing && (
        <View className="flex-row items-center justify-center">
          <View className="w-2 h-2 rounded-full bg-yellow-500 mr-2" />
          <Text className="text-white text-sm">
            Syncing {queueSize} items...
          </Text>
        </View>
      )}
      
      {isOnline && !isSyncing && queueSize > 0 && (
        <View className="flex-row items-center justify-center">
          <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
          <Text className="text-white text-sm">
            Synced
          </Text>
        </View>
      )}
    </View>
  );
}
