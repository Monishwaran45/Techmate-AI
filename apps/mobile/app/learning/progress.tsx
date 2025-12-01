import { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { api } from '../../src/lib/api';

interface ProgressData {
  totalMilestones: number;
  completedMilestones: number;
  recentActivity: {
    milestoneTitle: string;
    completedAt: string;
  }[];
}

export default function ProgressScreen() {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const response = await api.get('/learning/progress');
      setProgress(response.data);
    } catch (error) {
      Alert.alert('Error', 'Could not load progress');
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

  if (!progress || progress.totalMilestones === 0) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-4xl mb-4">📊</Text>
        <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
          No Progress Yet
        </Text>
        <Text className="text-gray-600 text-center">
          Start learning to track your progress
        </Text>
      </View>
    );
  }

  const progressPercentage = (progress.completedMilestones / progress.totalMilestones) * 100;

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-6 py-8">
        <Text className="text-3xl font-bold text-gray-900 mb-6">My Progress</Text>

        <View className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Overall Progress</Text>
          
          <View className="items-center mb-4">
            <View className="w-32 h-32 rounded-full border-8 border-blue-600 items-center justify-center">
              <Text className="text-3xl font-bold text-blue-600">
                {Math.round(progressPercentage)}%
              </Text>
            </View>
          </View>

          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-3xl font-bold text-gray-900">
                {progress.completedMilestones}
              </Text>
              <Text className="text-gray-600">Completed</Text>
            </View>
            <View className="items-center">
              <Text className="text-3xl font-bold text-gray-900">
                {progress.totalMilestones - progress.completedMilestones}
              </Text>
              <Text className="text-gray-600">Remaining</Text>
            </View>
          </View>
        </View>

        {progress.recentActivity.length > 0 && (
          <View className="bg-white rounded-lg p-6 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Recent Activity
            </Text>
            <View className="space-y-3">
              {progress.recentActivity.map((activity, index) => (
                <View key={index} className="flex-row items-start">
                  <Text className="text-2xl mr-3">✅</Text>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-medium mb-1">
                      {activity.milestoneTitle}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {new Date(activity.completedAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
