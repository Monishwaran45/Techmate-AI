import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const features = [
    { title: 'Learning Roadmap', icon: '📚', route: '/learning' },
    { title: 'Project Generator', icon: '💻', route: '/projects' },
    { title: 'Interview Prep', icon: '🎯', route: '/interview' },
    { title: 'Job Matching', icon: '💼', route: '/jobs' },
    { title: 'Productivity', icon: '✅', route: '/productivity' },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-6 py-8">
        <Text className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.profile?.name || 'there'}!
        </Text>
        <Text className="text-lg text-gray-600 mb-8">
          Continue your learning journey
        </Text>

        <View className="mb-6">
          <Text className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</Text>
          <View className="space-y-3">
            {features.map((feature) => (
              <TouchableOpacity
                key={feature.title}
                className="bg-white rounded-lg p-4 flex-row items-center shadow-sm"
                onPress={() => router.push(feature.route as any)}
              >
                <Text className="text-3xl mr-4">{feature.icon}</Text>
                <Text className="text-lg font-medium text-gray-900">{feature.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <Text className="text-lg font-semibold text-blue-900 mb-2">
            🎉 Your Progress
          </Text>
          <Text className="text-blue-700">
            You're making great progress! Keep up the momentum.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
