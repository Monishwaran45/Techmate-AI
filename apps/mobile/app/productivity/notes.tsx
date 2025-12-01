import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../src/lib/api';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function NotesScreen() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const response = await api.get('/notes');
      setNotes(response.data);
    } catch (error) {
      Alert.alert('Error', 'Could not load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) {
      Alert.alert('Error', 'Please fill in both title and content');
      return;
    }

    try {
      await api.post('/notes', {
        title: newNoteTitle,
        content: newNoteContent,
        tags: [],
      });
      setNewNoteTitle('');
      setNewNoteContent('');
      setShowAddForm(false);
      loadNotes();
    } catch (error) {
      Alert.alert('Error', 'Could not create note');
    }
  };

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
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-3xl font-bold text-gray-900">Notes</Text>
          <TouchableOpacity
            className="bg-blue-600 rounded-lg px-4 py-2"
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Text className="text-white font-semibold">+ Add</Text>
          </TouchableOpacity>
        </View>

        {showAddForm && (
          <View className="bg-white rounded-lg p-4 mb-6 shadow-sm">
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 mb-3"
              placeholder="Note title..."
              value={newNoteTitle}
              onChangeText={setNewNoteTitle}
            />
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 mb-3"
              placeholder="Note content..."
              value={newNoteContent}
              onChangeText={setNewNoteContent}
              multiline
              numberOfLines={4}
            />
            <View className="flex-row space-x-2">
              <TouchableOpacity
                className="flex-1 bg-blue-600 rounded-lg py-3"
                onPress={handleAddNote}
              >
                <Text className="text-white text-center font-semibold">Create</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 border border-gray-300 rounded-lg py-3"
                onPress={() => {
                  setShowAddForm(false);
                  setNewNoteTitle('');
                  setNewNoteContent('');
                }}
              >
                <Text className="text-gray-700 text-center font-semibold">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {notes.length === 0 ? (
          <View className="bg-white rounded-lg p-8 items-center">
            <Text className="text-4xl mb-4">📝</Text>
            <Text className="text-xl font-semibold text-gray-900 mb-2">
              No Notes Yet
            </Text>
            <Text className="text-gray-600 text-center">
              Create your first note to get started
            </Text>
          </View>
        ) : (
          <View className="space-y-4">
            {notes.map((note) => (
              <TouchableOpacity
                key={note.id}
                className="bg-white rounded-lg p-4 shadow-sm"
                onPress={() => router.push(`/productivity/note/${note.id}`)}
              >
                <Text className="text-lg font-semibold text-gray-900 mb-2">
                  {note.title}
                </Text>
                <Text className="text-gray-600 mb-3" numberOfLines={2}>
                  {note.content}
                </Text>
                <Text className="text-gray-400 text-sm">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
