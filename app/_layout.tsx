import { Stack } from 'expo-router';
import { DesignProvider } from '../context/DesignContext';

export default function RootLayout() {
  return (
    <DesignProvider>
      <Stack
        screenOptions={{
          headerTitleAlign: 'center',
        }}
      >
        <Stack.Screen name="index" options={{ title: 'AI Jewelry' }} />
        <Stack.Screen name="chat" options={{ title: 'Design Chat' }} />
        <Stack.Screen name="summary" options={{ title: 'Design Summary' }} />
        <Stack.Screen name="image-result" options={{ title: 'Generated Design' }} />
        <Stack.Screen name="saved-designs" options={{ title: 'Saved Designs' }} />
        <Stack.Screen name="vendor-dashboard" options={{ title: 'Vendor Dashboard' }} />
      </Stack>
    </DesignProvider>
  );
}