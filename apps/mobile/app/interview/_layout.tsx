import { Stack } from 'expo-router';

export default function InterviewLayout() {
  return (
    <Stack>
      <Stack.Screen name="chat" options={{ title: 'Mock Interview' }} />
      <Stack.Screen name="questions" options={{ title: 'Question Bank' }} />
      <Stack.Screen name="results" options={{ title: 'My Results' }} />
    </Stack>
  );
}
