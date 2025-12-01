import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../src/lib/api';

interface Milestone {
  id: string;
  title: string;
  description: string;
  topics: string[];
  completed: boolean;
  order: number;
}

interface Roadmap {
  id: string;
  title: string;
  milestones: Milestone[];
}

export default function RoadmapScreen() {
  const router = useRouter();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoadmap();
  }, []);

  const loadRoadmap = async () => {
    try {
      const response = await api.get('/learning/roadmap');
      setRoadmap(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // No roadmap yet
        setRoadmap(null);
      } else {
        Alert.alert('Error', 'Could not load roadmap');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRoadmap = () => {
    router.push('/learning/generate-roadmap');
  };

  const handleToggleMilestone = async (milestoneId: string) => {
    try {
      await api.put(`/learning/progress/${milestoneId}`);
      loadRoadmap();
    } catch (error) {
      Alert.alert('Error', 'Could not update progress');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!roadmap) {
    return (
      <ScrollView className="flex-1 bg-white">
        <View className="px-6 py-20">
          <Text className="text-4xl text-center mb-4">📚</Text>
          <Text className="text-2xl font-bold text-gray-900 text-center mb-4">
            No Roadmap Yet
          </Text>
          <Text className="text-lg text-gray-600 text-center mb-8">
            Create a personalized learning roadmap based on your goals
          </Text>
          <TouchableOpacity
            className="bg-blue-600 rounded-lg py-4"
            onPress={handleGenerateRoadmap}
          >
            <Text className="text-white text-center text-lg font-semibold">
              Generate Roadmap
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const completedCount = roadmap.milestones.filter(m => m.completed).length;
  const progress = (completedCount / roadmap.milestones.length) * 100;

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-6 py-8">
        <Text className="text-3xl font-bold text-gray-900 mb-2">{roadmap.title}</Text>
        
        <View className="bg-white rounded-lg p-4 mb-6 shadow-sm">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-600">Progress</Text>
            <Text className="text-blue-600 font-semibold">
              {completedCount}/{roadmap.milestones.length}
            </Text>
          </View>
          <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <View 
              className="h-full bg-blue-600 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </View>
        </View>

        <View className="space-y-4">
          {roadmap.milestones
            .sort((a, b) => a.order - b.order)
            .map((milestone) => (
              <TouchableOpacity
                key={milestone.id}
                className={`bg-white rounded-lg p-4 shadow-sm ${
                  milestone.completed ? 'border-2 border-green-500' : ''
                }`}
                onPress={() => handleToggleMilestone(milestone.id)}
              >
                <View className="flex-row items-start mb-2">
                  <Text className="text-2xl mr-3">
                    {milestone.completed ? '✅' : '⭕'}
                  </Text>
                  <View className="flex-1">
                    <Text className={`text-lg font-semibold mb-1 ${
                      milestone.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                    }`}>
                      {milestone.title}
                    </Text>
                    <Text className="text-gray-600 mb-2">{milestone.description}</Text>
                    <View className="flex-row flex-wrap">
                      {milestone.topics.slice(0, 3).map((topic, idx) => (
                        <View key={idx} className="bg-blue-50 rounded-full px-3 py-1 mr-2 mb-2">
                          <Text className="text-blue-700 text-sm">{topic}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
        </View>
      </View>
    </ScrollView>
  );
}
