import { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { api } from '../../src/lib/api';

interface Architecture {
  id: string;
  folderStructure: any;
  techStack: {
    frontend: string[];
    backend: string[];
    database: string[];
  };
  tasks: {
    title: string;
    description: string;
  }[];
}

export default function ArchitectureScreen() {
  const { ideaId } = useLocalSearchParams();
  const [architecture, setArchitecture] = useState<Architecture | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ideaId) {
      loadArchitecture();
    }
  }, [ideaId]);

  const loadArchitecture = async () => {
    try {
      const response = await api.post('/projects/architecture', {
        projectIdeaId: ideaId,
      });
      setArchitecture(response.data);
    } catch (error) {
      Alert.alert('Error', 'Could not load architecture');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!architecture) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-4xl mb-4">🏗️</Text>
        <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
          No Architecture
        </Text>
        <Text className="text-gray-600 text-center">
          Select a project idea to generate architecture
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-6 py-8">
        <Text className="text-3xl font-bold text-gray-900 mb-6">Architecture</Text>

        <View className="bg-white rounded-lg p-6 mb-4 shadow-sm">
          <Text className="text-xl font-semibold text-gray-900 mb-4">Tech Stack</Text>
          
          {architecture.techStack.frontend.length > 0 && (
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Frontend</Text>
              <View className="flex-row flex-wrap">
                {architecture.techStack.frontend.map((tech, idx) => (
                  <View key={idx} className="bg-blue-50 rounded-full px-3 py-1 mr-2 mb-2">
                    <Text className="text-blue-700">{tech}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {architecture.techStack.backend.length > 0 && (
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Backend</Text>
              <View className="flex-row flex-wrap">
                {architecture.techStack.backend.map((tech, idx) => (
                  <View key={idx} className="bg-green-50 rounded-full px-3 py-1 mr-2 mb-2">
                    <Text className="text-green-700">{tech}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {architecture.techStack.database.length > 0 && (
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Database</Text>
              <View className="flex-row flex-wrap">
                {architecture.techStack.database.map((tech, idx) => (
                  <View key={idx} className="bg-purple-50 rounded-full px-3 py-1 mr-2 mb-2">
                    <Text className="text-purple-700">{tech}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View className="bg-white rounded-lg p-6 shadow-sm">
          <Text className="text-xl font-semibold text-gray-900 mb-4">Tasks</Text>
          <View className="space-y-3">
            {architecture.tasks.map((task, index) => (
              <View key={index} className="border-l-4 border-blue-600 pl-4 py-2">
                <Text className="text-gray-900 font-medium mb-1">{task.title}</Text>
                <Text className="text-gray-600 text-sm">{task.description}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
