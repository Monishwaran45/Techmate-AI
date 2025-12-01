import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../src/lib/api';

export default function ResumeUploadScreen() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    // In a real app, this would use expo-document-picker
    Alert.alert('Info', 'File picker would open here. For demo, simulating upload...');
    
    setUploading(true);
    try {
      // Simulate file upload
      const formData = new FormData();
      // formData.append('file', file);
      
      const response = await api.post('/jobs/resume/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      Alert.alert('Success', 'Resume uploaded successfully!');
      router.push(`/jobs/score?resumeId=${response.data.id}`);
    } catch (error) {
      Alert.alert('Error', 'Could not upload resume');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-6 py-20">
        <Text className="text-4xl text-center mb-4">📄</Text>
        <Text className="text-2xl font-bold text-gray-900 text-center mb-4">
          Upload Your Resume
        </Text>
        <Text className="text-lg text-gray-600 text-center mb-8">
          Get instant ATS score and optimization suggestions
        </Text>

        <View className="border-2 border-dashed border-gray-300 rounded-lg p-12 mb-6 items-center">
          <Text className="text-6xl mb-4">📎</Text>
          <Text className="text-gray-600 text-center mb-2">
            Tap to select your resume
          </Text>
          <Text className="text-gray-500 text-sm text-center">
            PDF, DOC, or DOCX (Max 5MB)
          </Text>
        </View>

        <TouchableOpacity
          className={`rounded-lg py-4 ${uploading ? 'bg-blue-300' : 'bg-blue-600'}`}
          onPress={handleUpload}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center text-lg font-semibold">
              Upload Resume
            </Text>
          )}
        </TouchableOpacity>

        <View className="mt-8 bg-blue-50 rounded-lg p-4">
          <Text className="text-blue-900 font-semibold mb-2">💡 Tips</Text>
          <Text className="text-blue-700 text-sm mb-1">
            • Use a clean, professional format
          </Text>
          <Text className="text-blue-700 text-sm mb-1">
            • Include relevant keywords
          </Text>
          <Text className="text-blue-700 text-sm">
            • Keep it to 1-2 pages
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
