import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { api } from '../../src/lib/api';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
}

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data);
    } catch (error) {
      Alert.alert('Error', 'Could not load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      await api.post('/tasks', {
        title: newTaskTitle,
        status: 'todo',
        priority: 'medium',
      });
      setNewTaskTitle('');
      setShowAddForm(false);
      loadTasks();
    } catch (error) {
      Alert.alert('Error', 'Could not create task');
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      await api.put(`/tasks/${task.id}`, { status: newStatus });
      loadTasks();
    } catch (error) {
      Alert.alert('Error', 'Could not update task');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-6 py-8">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-3xl font-bold text-gray-900">Tasks</Text>
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
              placeholder="Task title..."
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
            />
            <View className="flex-row space-x-2">
              <TouchableOpacity
                className="flex-1 bg-blue-600 rounded-lg py-3"
                onPress={handleAddTask}
              >
                <Text className="text-white text-center font-semibold">Create</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 border border-gray-300 rounded-lg py-3"
                onPress={() => {
                  setShowAddForm(false);
                  setNewTaskTitle('');
                }}
              >
                <Text className="text-gray-700 text-center font-semibold">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {todoTasks.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">To Do</Text>
            <View className="space-y-3">
              {todoTasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  className="bg-white rounded-lg p-4 shadow-sm"
                  onPress={() => handleToggleStatus(task)}
                >
                  <View className="flex-row items-start">
                    <View className="w-6 h-6 rounded-full border-2 border-gray-300 mr-3 mt-1" />
                    <View className="flex-1">
                      <Text className="text-gray-900 font-medium mb-1">{task.title}</Text>
                      {task.description && (
                        <Text className="text-gray-600 text-sm mb-2">{task.description}</Text>
                      )}
                      <View className={`self-start px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                        <Text className="text-xs font-medium capitalize">{task.priority}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {doneTasks.length > 0 && (
          <View>
            <Text className="text-lg font-semibold text-gray-900 mb-3">Done</Text>
            <View className="space-y-3">
              {doneTasks.map((task) => (
                <TouchableOpacity
                  key={task.id}
                  className="bg-white rounded-lg p-4 shadow-sm opacity-60"
                  onPress={() => handleToggleStatus(task)}
                >
                  <View className="flex-row items-start">
                    <View className="w-6 h-6 rounded-full bg-green-600 mr-3 mt-1 items-center justify-center">
                      <Text className="text-white text-xs">✓</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 font-medium line-through">{task.title}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {tasks.length === 0 && (
          <View className="bg-white rounded-lg p-8 items-center">
            <Text className="text-4xl mb-4">✅</Text>
            <Text className="text-xl font-semibold text-gray-900 mb-2">
              No Tasks Yet
            </Text>
            <Text className="text-gray-600 text-center">
              Create your first task to get started
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
