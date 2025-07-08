import { useKeepAwake } from 'expo-keep-awake';
import { Stack } from 'expo-router';
import '@/global.css';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from 'react';

export default function RootLayout() {
  useKeepAwake();

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
  }, []);

  return (
    <Stack initialRouteName="(home)">
      <Stack.Screen name="(home)" options={{ title: 'Home', headerShown: false }} />
      <Stack.Screen name="(login)" options={{ title: 'Login', headerShown: false }} />
      <Stack.Screen name="(setting)" options={{ title: 'Settings', headerShown: false }} />
    </Stack>
  );
}
