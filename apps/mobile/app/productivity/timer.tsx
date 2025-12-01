import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { api } from '../../src/lib/api';

export default function TimerScreen() {
  const [duration, setDuration] = useState(25); // minutes
  const [timeLeft, setTimeLeft] = useState(duration * 60); // seconds
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleComplete();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleStart = async () => {
    try {
      const response = await api.post('/timer/start', {
        duration: duration * 60,
      });
      setSessionId(response.data.id);
      setIsRunning(true);
      setTimeLeft(duration * 60);
    } catch (error) {
      Alert.alert('Error', 'Could not start timer');
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleResume = () => {
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(duration * 60);
    setSessionId(null);
  };

  const handleComplete = async () => {
    setIsRunning(false);
    Alert.alert('🎉 Session Complete!', 'Great work! Take a break.');
    
    if (sessionId) {
      try {
        await api.put(`/timer/${sessionId}/complete`);
      } catch (error) {
        // Silent fail
      }
    }
    
    handleReset();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-2xl font-bold text-gray-900 mb-8">Focus Timer</Text>

        <View className="relative w-64 h-64 items-center justify-center mb-12">
          <View className="absolute w-full h-full rounded-full border-8 border-gray-200" />
          <View 
            className="absolute w-full h-full rounded-full border-8 border-blue-600"
            style={{
              transform: [{ rotate: `${(progress * 3.6) - 90}deg` }],
              borderTopColor: 'transparent',
              borderRightColor: progress > 25 ? '#2563eb' : 'transparent',
              borderBottomColor: progress > 50 ? '#2563eb' : 'transparent',
              borderLeftColor: progress > 75 ? '#2563eb' : 'transparent',
            }}
          />
          <Text className="text-6xl font-bold text-gray-900">
            {formatTime(timeLeft)}
          </Text>
        </View>

        {!isRunning && timeLeft === duration * 60 && (
          <View className="w-full mb-8">
            <Text className="text-center text-gray-700 mb-4">Duration (minutes)</Text>
            <View className="flex-row justify-center space-x-4">
              {[15, 25, 45, 60].map((mins) => (
                <TouchableOpacity
                  key={mins}
                  className={`px-6 py-3 rounded-lg ${
                    duration === mins ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  onPress={() => {
                    setDuration(mins);
                    setTimeLeft(mins * 60);
                  }}
                >
                  <Text className={`font-semibold ${
                    duration === mins ? 'text-white' : 'text-gray-700'
                  }`}>
                    {mins}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View className="w-full space-y-3">
          {!isRunning && timeLeft === duration * 60 ? (
            <TouchableOpacity
              className="bg-blue-600 rounded-lg py-4"
              onPress={handleStart}
            >
              <Text className="text-white text-center text-lg font-semibold">
                Start Focus Session
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                className={`rounded-lg py-4 ${isRunning ? 'bg-yellow-600' : 'bg-green-600'}`}
                onPress={isRunning ? handlePause : handleResume}
              >
                <Text className="text-white text-center text-lg font-semibold">
                  {isRunning ? 'Pause' : 'Resume'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="border border-gray-300 rounded-lg py-4"
                onPress={handleReset}
              >
                <Text className="text-gray-700 text-center text-lg font-semibold">
                  Reset
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}
