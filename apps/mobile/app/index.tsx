import { View, Text } from 'react-native';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-4xl font-bold text-gray-900 mb-4">TechMate AI</Text>
      <Text className="text-xl text-gray-600">Your AI-Powered Tech Mentor</Text>
    </View>
  );
}
