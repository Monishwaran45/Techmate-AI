import { Stack } from 'expo-router';

export default function ProductivityLayout() {
  return (
    <Stack>
      <Stack.Screen name="tasks" options={{ title: 'Tasks' }} />
      <Stack.Screen name="timer" options={{ title: 'Focus Timer' }} />
      <Stack.Screen name="notes" options={{ title: 'Notes' }} />
    </Stack>
  );
}
