import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../src/lib/api';

interface ResumeScore {
  overallScore: number;
  atsCompatibility: number;
  contentQuality: number;
  suggestions: string[];
}

export default function ResumeScoreScreen() {
  const { resumeId } = useLocalSearchParams();
  const router = useRouter();
  const [score, setScore] = useState<ResumeScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (resumeId) {
      loadScore();
    }
  }, [resumeId]);

  const loadScore = async () => {
    try {
      const response = await api.get(`/jobs/resume/${resumeId}/score`);
      setScore(response.data);
    } catch (error) {
      Alert.alert('Error', 'Could not load resume score');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = () => {
    router.push(`/jobs/optimize?resumeId=${resumeId}`);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!score) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-4xl mb-4">📊</Text>
        <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
          No Score Available
        </Text>
        <Text className="text-gray-600 text-center">
          Upload a resume to see your score
        </Text>
      </View>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-6 py-8">
        <Text className="text-3xl font-bold text-gray-900 mb-6">Resume Score</Text>

        <View className="bg-white rounded-lg p-6 mb-6 shadow-sm items-center">
          <View className={`w-32 h-32 rounded-full ${getScoreBg(score.overallScore)} items-center justify-center mb-4`}>
            <Text className={`text-4xl font-bold ${getScoreColor(score.overallScore)}`}>
              {score.overallScore}
            </Text>
          </View>
          <Text className="text-xl font-semibold text-gray-900 mb-2">
            Overall Score
          </Text>
          <Text className="text-gray-600 text-center">
            {score.overallScore >= 80 ? 'Excellent!' :
             score.overallScore >= 60 ? 'Good, but can improve' :
             'Needs improvement'}
          </Text>
        </View>

        <View className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Score Breakdown
          </Text>
          
          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-700">ATS Compatibility</Text>
              <Text className={`font-semibold ${getScoreColor(score.atsCompatibility)}`}>
                {score.atsCompatibility}%
              </Text>
            </View>
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <View 
                className={`h-full rounded-full ${
                  score.atsCompatibility >= 80 ? 'bg-green-600' :
                  score.atsCompatibility >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                }`}
                style={{ width: `${score.atsCompatibility}%` }}
              />
            </View>
          </View>

          <View>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-700">Content Quality</Text>
              <Text className={`font-semibold ${getScoreColor(score.contentQuality)}`}>
                {score.contentQuality}%
              </Text>
            </View>
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <View 
                className={`h-full rounded-full ${
                  score.contentQuality >= 80 ? 'bg-green-600' :
                  score.contentQuality >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                }`}
                style={{ width: `${score.contentQuality}%` }}
              />
            </View>
          </View>
        </View>

        {score.suggestions.length > 0 && (
          <View className="bg-white rounded-lg p-6 mb-6 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              💡 Suggestions
            </Text>
            <View className="space-y-2">
              {score.suggestions.map((suggestion, index) => (
                <Text key={index} className="text-gray-600 mb-2">
                  • {suggestion}
                </Text>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          className="bg-blue-600 rounded-lg py-4"
          onPress={handleOptimize}
        >
          <Text className="text-white text-center text-lg font-semibold">
            Optimize Resume
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
