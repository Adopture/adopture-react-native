import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Adopture } from '@adopture/react-native';

/** Change this to your actual app key for real testing. */
const TEST_APP_KEY = 'ak_MBB7ZSKBn9X190O9kTTx5TtL';

export default function RootLayout() {
  useEffect(() => {
    Adopture.init({
      appKey: TEST_APP_KEY,
      apiEndpoint: 'http://192.168.178.142:3001',
      debug: true,
      autoCapture: true,
      flushIntervalMs: 10_000,
      flushAt: 5,
      maxQueueSize: 500,
    }).then(() => {
      Adopture.identify('test-user-001');
    });

    return () => {
      Adopture.shutdown();
    };
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1a1a2e' },
          headerTintColor: '#fff',
          contentStyle: { backgroundColor: '#16213e' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'SDK Test App' }} />
        <Stack.Screen name="profile" options={{ title: 'Profile' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="shop" options={{ title: 'Shop' }} />
        <Stack.Screen name="revenue" options={{ title: 'Revenue Tracking' }} />
        <Stack.Screen name="stress" options={{ title: 'Stress Test' }} />
      </Stack>
    </>
  );
}
