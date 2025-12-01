import { Stack } from 'expo-router';

export default function JobsLayout() {
  return (
    <Stack>
      <Stack.Screen name="upload" options={{ title: 'Upload Resume' }} />
      <Stack.Screen name="score" options={{ title: 'Resume Score' }} />
      <Stack.Screen name="matches" options={{ title: 'Job Matches' }} />
    </Stack>
  );
}
