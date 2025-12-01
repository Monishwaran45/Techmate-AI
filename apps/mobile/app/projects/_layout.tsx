import { Stack } from 'expo-router';

export default function ProjectsLayout() {
  return (
    <Stack>
      <Stack.Screen name="ideas" options={{ title: 'Project Ideas' }} />
      <Stack.Screen name="architecture" options={{ title: 'Architecture' }} />
      <Stack.Screen name="code" options={{ title: 'Starter Code' }} />
    </Stack>
  );
}
