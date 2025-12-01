import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function LearningScreen() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-6 py-8">
        <Text className="text-3xl font-bold text-gray-900 mb-6">Learning</Text>

        <TouchableOpacity
          className="bg-white rounded-lg p-6 mb-4 shadow-sm"
          onPress={() => router.push('/learning/roadmap')}
        >
          <Text className="text-2xl mb-2">📚</Text>
          <Text className="text-xl font-semibold text-gray-900 mb-2">
            My Roadmap
          </Text>
          <Text className="text-gray-600">
            View your personalized learning path
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white rounded-lg p-6 mb-4 shadow-sm"
          onPress={() => router.push('/learning/concept')}
        >
          <Text className="text-2xl mb-2">💡</Text>
          <Text className="text-xl font-semibold text-gray-900 mb-2">
            Ask AI Mentor
          </Text>
          <Text className="text-gray-600">
            Get explanations for any concept
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white rounded-lg p-6 mb-4 shadow-sm"
          onPress={() => router.push('/learning/progress')}
        >
          <Text className="text-2xl mb-2">📊</Text>
          <Text className="text-xl font-semibold text-gray-900 mb-2">
            My Progress
          </Text>
          <Text className="text-gray-600">
            Track your learning achievements
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white rounded-lg p-6 shadow-sm"
          onPress={() => router.push('/learning/news')}
        >
          <Text className="text-2xl mb-2">📰</Text>
          <Text className="text-xl font-semibold text-gray-900 mb-2">
            Tech News
          </Text>
          <Text className="text-gray-600">
            Stay updated with latest tech trends
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
