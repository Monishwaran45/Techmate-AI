import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { api } from '../../src/lib/api';

interface Question {
  id: string;
  type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  content: string;
}

export default function QuestionsScreen() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const response = await api.get('/interview/questions');
      setQuestions(response.data);
    } catch (error) {
      Alert.alert('Error', 'Could not load questions');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredQuestions = filter === 'all'
    ? questions
    : questions.filter(q => q.difficulty === filter);

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-6 py-8">
        <Text className="text-3xl font-bold text-gray-900 mb-6">Question Bank</Text>

        <View className="mb-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-2">
              {(['all', 'easy', 'medium', 'hard'] as const).map((level) => (
                <TouchableOpacity
                  key={level}
                  className={`px-4 py-2 rounded-lg ${
                    filter === level ? 'bg-blue-600' : 'bg-white border border-gray-300'
                  }`}
                  onPress={() => setFilter(level)}
                >
                  <Text className={`font-medium capitalize ${
                    filter === level ? 'text-white' : 'text-gray-700'
                  }`}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {filteredQuestions.length === 0 ? (
          <View className="bg-white rounded-lg p-8 items-center">
            <Text className="text-4xl mb-4">📝</Text>
            <Text className="text-xl font-semibold text-gray-900 mb-2">
              No Questions
            </Text>
            <Text className="text-gray-600 text-center">
              No questions available for this filter
            </Text>
          </View>
        ) : (
          <View className="space-y-4">
            {filteredQuestions.map((question) => (
              <View key={question.id} className="bg-white rounded-lg p-4 shadow-sm">
                <View className="flex-row items-start justify-between mb-2">
                  <View className={`px-3 py-1 rounded-full ${getDifficultyColor(question.difficulty)}`}>
                    <Text className="text-xs font-medium capitalize">
                      {question.difficulty}
                    </Text>
                  </View>
                  <View className="bg-blue-50 px-3 py-1 rounded-full">
                    <Text className="text-blue-700 text-xs font-medium">
                      {question.type}
                    </Text>
                  </View>
                </View>
                <Text className="text-gray-900 leading-6">{question.content}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
