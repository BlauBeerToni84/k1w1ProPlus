import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_700Bold
} from '@expo-google-fonts/inter';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_700Bold
} from '@expo-google-fonts/space-grotesk';
import {
  SourceCodePro_400Regular
} from '@expo-google-fonts/source-code-pro';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Bold': Inter_700Bold,
    'SpaceGrotesk-Regular': SpaceGrotesk_400Regular,
    'SpaceGrotesk-Bold': SpaceGrotesk_700Bold,
    'SourceCodePro-Regular': SourceCodePro_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/signup" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
