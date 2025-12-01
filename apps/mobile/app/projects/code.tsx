import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { api } from '../../src/lib/api';

interface CodeFile {
  path: string;
  content: string;
  language: string;
}

export default function CodeScreen() {
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<CodeFile | null>(null);
  const [loading, setLoading] = useState(false);

  const loadCode = async (architectureId: string) => {
    setLoading(true);
    try {
      const response = await api.post('/projects/code', {
        architectureId,
      });
      setFiles(response.data.files || []);
      if (response.data.files?.length > 0) {
        setSelectedFile(response.data.files[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not load code');
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

  if (files.length === 0) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-4xl mb-4">💻</Text>
        <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
          No Code Generated
        </Text>
        <Text className="text-gray-600 text-center">
          Generate architecture first to see starter code
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="border-b border-gray-200">
        <ScrollView horizontal className="px-4 py-3">
          {files.map((file, index) => (
            <TouchableOpacity
              key={index}
              className={`px-4 py-2 rounded-lg mr-2 ${
                selectedFile?.path === file.path ? 'bg-blue-600' : 'bg-gray-100'
              }`}
              onPress={() => setSelectedFile(file)}
            >
              <Text className={`text-sm font-medium ${
                selectedFile?.path === file.path ? 'text-white' : 'text-gray-700'
              }`}>
                {file.path.split('/').pop()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {selectedFile && (
        <ScrollView className="flex-1 p-4">
          <View className="bg-gray-900 rounded-lg p-4">
            <Text className="text-gray-300 text-xs mb-2">{selectedFile.path}</Text>
            <Text className="text-green-400 font-mono text-xs">
              {selectedFile.content}
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
