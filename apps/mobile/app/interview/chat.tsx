import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../src/lib/api';

interface Message {
  role: 'interviewer' | 'candidate';
  content: string;
}

interface Session {
  id: string;
  type: 'dsa' | 'system_design' | 'behavioral';
  status: 'active' | 'completed';
}

export default function InterviewChatScreen() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [interviewType, setInterviewType] = useState<'dsa' | 'system_design' | 'behavioral'>('dsa');

  const startSession = async () => {
    setLoading(true);
    try {
      const response = await api.post('/interview/session', {
        type: interviewType,
      });
      setSession(response.data);
      
      // Get first question
      const questionResponse = await api.get(`/interview/session/${response.data.id}/question`);
      setMessages([{
        role: 'interviewer',
        content: questionResponse.data.content,
      }]);
    } catch (error) {
      Alert.alert('Error', 'Could not start interview session');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !session || loading) return;

    const candidateMessage: Message = { role: 'candidate', content: input.trim() };
    setMessages(prev => [...prev, candidateMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post(`/interview/session/${session.id}/answer`, {
        answer: candidateMessage.content,
      });
      
      const feedbackMessage: Message = {
        role: 'interviewer',
        content: response.data.feedback,
      };
      setMessages(prev => [...prev, feedbackMessage]);
    } catch (error) {
      Alert.alert('Error', 'Could not submit answer');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!session) return;

    Alert.alert(
      'Complete Interview',
      'Are you sure you want to end this interview?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await api.post(`/interview/session/${session.id}/complete`);
              router.push('/interview/results');
            } catch (error) {
              Alert.alert('Error', 'Could not complete interview');
            }
          },
        },
      ]
    );
  };

  if (!session) {
    return (
      <ScrollView className="flex-1 bg-white">
        <View className="px-6 py-20">
          <Text className="text-4xl text-center mb-4">🎯</Text>
          <Text className="text-2xl font-bold text-gray-900 text-center mb-4">
            Start Mock Interview
          </Text>
          <Text className="text-lg text-gray-600 text-center mb-8">
            Choose your interview type
          </Text>

          <View className="space-y-3 mb-8">
            {(['dsa', 'system_design', 'behavioral'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                className={`border rounded-lg p-4 ${
                  interviewType === type ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                }`}
                onPress={() => setInterviewType(type)}
              >
                <Text className={`text-lg font-medium ${
                  interviewType === type ? 'text-blue-600' : 'text-gray-700'
                }`}>
                  {type === 'dsa' ? 'Data Structures & Algorithms' :
                   type === 'system_design' ? 'System Design' : 'Behavioral'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            className={`rounded-lg py-4 ${loading ? 'bg-blue-300' : 'bg-blue-600'}`}
            onPress={startSession}
            disabled={loading}
          >
            <Text className="text-white text-center text-lg font-semibold">
              {loading ? 'Starting...' : 'Start Interview'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <View className="border-b border-gray-200 px-4 py-3 flex-row justify-between items-center">
        <Text className="text-lg font-semibold text-gray-900 capitalize">
          {session.type.replace('_', ' ')} Interview
        </Text>
        <TouchableOpacity
          className="bg-red-50 px-4 py-2 rounded-lg"
          onPress={handleComplete}
        >
          <Text className="text-red-600 font-semibold">End</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        <View className="space-y-4">
          {messages.map((message, index) => (
            <View
              key={index}
              className={`p-4 rounded-lg ${
                message.role === 'candidate'
                  ? 'bg-blue-600 self-end ml-12'
                  : 'bg-gray-100 self-start mr-12'
              }`}
            >
              <Text className={message.role === 'candidate' ? 'text-white' : 'text-gray-900'}>
                {message.content}
              </Text>
            </View>
          ))}
          {loading && (
            <View className="bg-gray-100 p-4 rounded-lg self-start mr-12">
              <ActivityIndicator size="small" color="#2563eb" />
            </View>
          )}
        </View>
      </ScrollView>

      <View className="border-t border-gray-200 p-4">
        <View className="flex-row items-center">
          <TextInput
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 mr-2"
            placeholder="Type your answer..."
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
            editable={!loading}
          />
          <TouchableOpacity
            className={`rounded-lg px-6 py-3 ${
              input.trim() && !loading ? 'bg-blue-600' : 'bg-gray-300'
            }`}
            onPress={handleSend}
            disabled={!input.trim() || loading}
          >
            <Text className="text-white font-semibold">Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
