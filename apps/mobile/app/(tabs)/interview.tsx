import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function InterviewScreen() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-6 py-8">
        <Text className="text-3xl font-bold text-gray-900 mb-6">Interview Prep</Text>

        <TouchableOpacity
          className="bg-white rounded-lg p-6 mb-4 shadow-sm"
          onPress={() => router.push('/interview/chat')}
        >
          <Text className="text-2xl mb-2">🎯</Text>
          <Text className="text-xl font-semibold text-gray-900 mb-2">
            Start Mock Interview
          </Text>
          <Text className="text-gray-600">
            Practice with AI interviewer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white rounded-lg p-6 mb-4 shadow-sm"
          onPress={() => router.push('/interview/questions')}
        >
          <Text className="text-2xl mb-2">📝</Text>
          <Text className="text-xl font-semibold text-gray-900 mb-2">
            Question Bank
          </Text>
          <Text className="text-gray-600">
            Browse practice questions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white rounded-lg p-6 shadow-sm"
          onPress={() => router.push('/interview/results')}
        >
          <Text className="text-2xl mb-2">📊</Text>
          <Text className="text-xl font-semibold text-gray-900 mb-2">
            My Results
          </Text>
          <Text className="text-gray-600">
            View past interview performance
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
