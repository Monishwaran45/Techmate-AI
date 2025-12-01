import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { api } from '../../src/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ConceptScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/learning/explain', {
        concept: userMessage.content,
      });
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.explanation,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I could not explain that concept. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView className="flex-1 px-4 py-6">
        {messages.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-4xl mb-4">💡</Text>
            <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
              Ask Your AI Mentor
            </Text>
            <Text className="text-gray-600 text-center px-6">
              Get clear explanations for any technical concept
            </Text>
          </View>
        ) : (
          <View className="space-y-4">
            {messages.map((message, index) => (
              <View
                key={index}
                className={`p-4 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 self-end ml-12'
                    : 'bg-gray-100 self-start mr-12'
                }`}
              >
                <Text className={message.role === 'user' ? 'text-white' : 'text-gray-900'}>
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
        )}
      </ScrollView>

      <View className="border-t border-gray-200 p-4">
        <View className="flex-row items-center">
          <TextInput
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 mr-2"
            placeholder="Ask about any concept..."
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
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
