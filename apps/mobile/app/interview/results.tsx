import { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { api } from '../../src/lib/api';

interface SessionResult {
  id: string;
  type: 'dsa' | 'system_design' | 'behavioral';
  completedAt: string;
  summary: {
    overallScore: number;
    strengths: string[];
    improvements: string[];
  };
}

export default function ResultsScreen() {
  const [results, setResults] = useState<SessionResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const response = await api.get('/interview/sessions');
      setResults(response.data.filter((s: any) => s.status === 'completed'));
    } catch (error) {
      Alert.alert('Error', 'Could not load results');
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

  if (results.length === 0) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-4xl mb-4">📊</Text>
        <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
          No Results Yet
        </Text>
        <Text className="text-gray-600 text-center">
          Complete an interview to see your results
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-6 py-8">
        <Text className="text-3xl font-bold text-gray-900 mb-6">My Results</Text>

        <View className="space-y-4">
          {results.map((result) => (
            <View key={result.id} className="bg-white rounded-lg p-6 shadow-sm">
              <View className="flex-row justify-between items-start mb-4">
                <View>
                  <Text className="text-lg font-semibold text-gray-900 capitalize mb-1">
                    {result.type.replace('_', ' ')}
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    {new Date(result.completedAt).toLocaleDateString()}
                  </Text>
                </View>
                <View className="bg-blue-100 rounded-full w-16 h-16 items-center justify-center">
                  <Text className="text-blue-600 font-bold text-xl">
                    {result.summary.overallScore}
                  </Text>
                </View>
              </View>

              {result.summary.strengths.length > 0 && (
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-900 mb-2">
                    ✅ Strengths
                  </Text>
                  {result.summary.strengths.map((strength, idx) => (
                    <Text key={idx} className="text-gray-600 text-sm mb-1">
                      • {strength}
                    </Text>
                  ))}
                </View>
              )}

              {result.summary.improvements.length > 0 && (
                <View>
                  <Text className="text-sm font-semibold text-gray-900 mb-2">
                    💡 Areas to Improve
                  </Text>
                  {result.summary.improvements.map((improvement, idx) => (
                    <Text key={idx} className="text-gray-600 text-sm mb-1">
                      • {improvement}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
