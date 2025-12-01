import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { api } from '../../src/lib/api';

interface JobMatch {
  id: string;
  jobTitle: string;
  company: string;
  matchScore: number;
  matchReasons: string[];
  jobUrl?: string;
}

export default function JobMatchesScreen() {
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const response = await api.get('/jobs/matches');
      setMatches(response.data);
    } catch (error) {
      Alert.alert('Error', 'Could not load job matches');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenJob = (url?: string) => {
    if (url) {
      Linking.openURL(url);
    } else {
      Alert.alert('Info', 'Job URL not available');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (matches.length === 0) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-4xl mb-4">💼</Text>
        <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
          No Matches Yet
        </Text>
        <Text className="text-gray-600 text-center">
          Upload your resume and set preferences to get job matches
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-6 py-8">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Job Matches</Text>
        <Text className="text-gray-600 mb-6">
          {matches.length} {matches.length === 1 ? 'match' : 'matches'} found
        </Text>

        <View className="space-y-4">
          {matches.map((match) => (
            <View key={match.id} className="bg-white rounded-lg p-6 shadow-sm">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1 mr-3">
                  <Text className="text-xl font-semibold text-gray-900 mb-1">
                    {match.jobTitle}
                  </Text>
                  <Text className="text-gray-600">{match.company}</Text>
                </View>
                <View className="bg-blue-100 rounded-full px-3 py-1">
                  <Text className="text-blue-600 font-bold">
                    {match.matchScore}%
                  </Text>
                </View>
              </View>

              {match.matchReasons.length > 0 && (
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-900 mb-2">
                    Why this matches:
                  </Text>
                  {match.matchReasons.slice(0, 3).map((reason, idx) => (
                    <Text key={idx} className="text-gray-600 text-sm mb-1">
                      • {reason}
                    </Text>
                  ))}
                </View>
              )}

              <TouchableOpacity
                className="bg-blue-600 rounded-lg py-3"
                onPress={() => handleOpenJob(match.jobUrl)}
              >
                <Text className="text-white text-center font-semibold">
                  View Job
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
