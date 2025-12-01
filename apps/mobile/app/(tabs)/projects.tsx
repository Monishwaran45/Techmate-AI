import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function ProjectsScreen() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-6 py-8">
        <Text className="text-3xl font-bold text-gray-900 mb-6">Projects</Text>

        <TouchableOpacity
          className="bg-white rounded-lg p-6 mb-4 shadow-sm"
          onPress={() => router.push('/projects/ideas')}
        >
          <Text className="text-2xl mb-2">💡</Text>
          <Text className="text-xl font-semibold text-gray-900 mb-2">
            Project Ideas
          </Text>
          <Text className="text-gray-600">
            Get AI-generated project suggestions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white rounded-lg p-6 mb-4 shadow-sm"
          onPress={() => router.push('/projects/architecture')}
        >
          <Text className="text-2xl mb-2">🏗️</Text>
          <Text className="text-xl font-semibold text-gray-900 mb-2">
            Architecture
          </Text>
          <Text className="text-gray-600">
            View generated project architecture
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-white rounded-lg p-6 shadow-sm"
          onPress={() => router.push('/projects/code')}
        >
          <Text className="text-2xl mb-2">💻</Text>
          <Text className="text-xl font-semibold text-gray-900 mb-2">
            Starter Code
          </Text>
          <Text className="text-gray-600">
            Browse generated code files
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
