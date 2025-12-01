import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

export default function MoreScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const menuItems = [
    { title: 'Profile', icon: '👤', route: '/profile' },
    { title: 'Jobs', icon: '💼', route: '/jobs' },
    { title: 'Productivity', icon: '✅', route: '/productivity' },
    { title: 'Settings', icon: '⚙️', route: '/settings' },
    { title: 'Help & Support', icon: '❓', route: '/support' },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-6 py-8">
        <View className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <Text className="text-2xl font-bold text-gray-900 mb-1">
            {user?.profile?.name || 'User'}
          </Text>
          <Text className="text-gray-600">{user?.email}</Text>
          <View className="mt-3 px-3 py-1 bg-blue-100 rounded-full self-start">
            <Text className="text-blue-700 font-medium capitalize">
              {user?.role || 'Member'}
            </Text>
          </View>
        </View>

        <View className="mb-6">
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.title}
              className="bg-white rounded-lg p-4 mb-2 flex-row items-center justify-between shadow-sm"
              onPress={() => router.push(item.route as any)}
            >
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">{item.icon}</Text>
                <Text className="text-lg text-gray-900">{item.title}</Text>
              </View>
              <Text className="text-gray-400 text-xl">›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          className="bg-red-50 border border-red-200 rounded-lg p-4"
          onPress={handleLogout}
        >
          <Text className="text-red-600 text-center text-lg font-semibold">
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
