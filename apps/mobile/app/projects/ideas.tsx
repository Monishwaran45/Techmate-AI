import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../src/lib/api';

interface ProjectIdea {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  technologies: string[];
  estimatedHours: number;
}

export default function ProjectIdeasScreen() {
  const router = useRouter();
  const [ideas, setIdeas] = useState<ProjectIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');

  const loadIdeas = async () => {
    setLoading(true);
    try {
      const response = await api.post('/projects/ideas', {
        difficulty,
        technologies: [],
      });
      setIdeas(response.data);
    } catch (error) {
      Alert.alert('Error', 'Could not load project ideas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIdeas();
  }, [difficulty]);

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-6 py-8">
        <Text className="text-3xl font-bold text-gray-900 mb-6">Project Ideas</Text>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-3">Difficulty Level</Text>
          <View className="flex-row space-x-2">
            {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
              <TouchableOpacity
                key={level}
                className={`flex-1 py-3 rounded-lg ${
                  difficulty === level ? 'bg-blue-600' : 'bg-white border border-gray-300'
                }`}
                onPress={() => setDifficulty(level)}
              >
                <Text className={`text-center font-medium capitalize ${
                  difficulty === level ? 'text-white' : 'text-gray-700'
                }`}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loading ? (
          <View className="py-20">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : ideas.length === 0 ? (
          <View className="bg-white rounded-lg p-8 items-center">
            <Text className="text-4xl mb-4">💡</Text>
            <Text className="text-xl font-semibold text-gray-900 mb-2">
              No Ideas Yet
            </Text>
            <Text className="text-gray-600 text-center">
              Generate project ideas to get started
            </Text>
          </View>
        ) : (
          <View className="space-y-4">
            {ideas.map((idea) => (
              <TouchableOpacity
                key={idea.id}
                className="bg-white rounded-lg p-4 shadow-sm"
                onPress={() => router.push(`/projects/architecture?ideaId=${idea.id}`)}
              >
                <View className="flex-row items-start justify-between mb-2">
                  <Text className="flex-1 text-lg font-semibold text-gray-900 mr-2">
                    {idea.title}
                  </Text>
                  <View className={`px-3 py-1 rounded-full ${getDifficultyColor(idea.difficulty)}`}>
                    <Text className="text-xs font-medium capitalize">
                      {idea.difficulty}
                    </Text>
                  </View>
                </View>
                
                <Text className="text-gray-600 mb-3">{idea.description}</Text>
                
                <View className="flex-row flex-wrap mb-2">
                  {idea.technologies.slice(0, 4).map((tech, idx) => (
                    <View key={idx} className="bg-blue-50 rounded-full px-3 py-1 mr-2 mb-2">
                      <Text className="text-blue-700 text-sm">{tech}</Text>
                    </View>
                  ))}
                </View>
                
                <Text className="text-gray-500 text-sm">
                  ⏱️ Estimated: {idea.estimatedHours} hours
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
