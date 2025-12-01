import { Stack } from 'expo-router';

export default function LearningLayout() {
  return (
    <Stack>
      <Stack.Screen name="roadmap" options={{ title: 'My Roadmap' }} />
      <Stack.Screen name="concept" options={{ title: 'AI Mentor' }} />
      <Stack.Screen name="progress" options={{ title: 'My Progress' }} />
      <Stack.Screen name="news" options={{ title: 'Tech News' }} />
    </Stack>
  );
}
