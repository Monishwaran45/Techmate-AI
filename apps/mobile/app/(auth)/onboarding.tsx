import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { api } from '../../src/lib/api';

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [skills, setSkills] = useState('');
  const [goals, setGoals] = useState('');
  const [experience, setExperience] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!name || !skills || !goals) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.put('/auth/profile', {
        name,
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        goals: goals.split(',').map(g => g.trim()).filter(Boolean),
        experience,
      });
      
      setUser(response.data);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Could not save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-20">
        <View className="mb-8">
          <View className="flex-row mb-4">
            {[1, 2, 3].map((s) => (
              <View
                key={s}
                className={`flex-1 h-2 rounded-full mx-1 ${
                  s <= step ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </View>
          <Text className="text-sm text-gray-600">Step {step} of 3</Text>
        </View>

        {step === 1 && (
          <>
            <Text className="text-3xl font-bold text-gray-900 mb-2">What's your name?</Text>
            <Text className="text-lg text-gray-600 mb-8">Let's personalize your experience</Text>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">Full Name</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="John Doe"
                value={name}
                onChangeText={setName}
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              className="bg-blue-600 rounded-lg py-4"
              onPress={() => setStep(2)}
              disabled={!name || loading}
            >
              <Text className="text-white text-center text-base font-semibold">Continue</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 2 && (
          <>
            <Text className="text-3xl font-bold text-gray-900 mb-2">Your Skills</Text>
            <Text className="text-lg text-gray-600 mb-8">What technologies do you know?</Text>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Skills (comma-separated)</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="JavaScript, React, Node.js"
                value={skills}
                onChangeText={setSkills}
                multiline
                numberOfLines={3}
                editable={!loading}
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">Experience Level</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="e.g., 2 years, Beginner, Intermediate"
                value={experience}
                onChangeText={setExperience}
                editable={!loading}
              />
            </View>

            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="flex-1 border border-gray-300 rounded-lg py-4"
                onPress={() => setStep(1)}
                disabled={loading}
              >
                <Text className="text-gray-700 text-center text-base font-semibold">Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-blue-600 rounded-lg py-4"
                onPress={() => setStep(3)}
                disabled={!skills || loading}
              >
                <Text className="text-white text-center text-base font-semibold">Continue</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <Text className="text-3xl font-bold text-gray-900 mb-2">Your Goals</Text>
            <Text className="text-lg text-gray-600 mb-8">What do you want to achieve?</Text>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">Goals (comma-separated)</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="Learn React Native, Build a portfolio, Get a job"
                value={goals}
                onChangeText={setGoals}
                multiline
                numberOfLines={4}
                editable={!loading}
              />
            </View>

            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="flex-1 border border-gray-300 rounded-lg py-4"
                onPress={() => setStep(2)}
                disabled={loading}
              >
                <Text className="text-gray-700 text-center text-base font-semibold">Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 rounded-lg py-4 ${loading ? 'bg-blue-300' : 'bg-blue-600'}`}
                onPress={handleComplete}
                disabled={!goals || loading}
              >
                <Text className="text-white text-center text-base font-semibold">
                  {loading ? 'Saving...' : 'Complete'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}
