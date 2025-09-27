import './src/initFirebase';
import React from 'react';
import { useFonts } from 'expo-font';
import AppNavigator from './src/navigation/AppNavigator'; // Keep for later, but not used immediately
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from './src/theme/colors';
import { FONTS } from './src/theme/fonts';
import { StatusBar } from 'expo-status-bar'; // Add StatusBar import

const App = () => {
  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
    'SpaceGrotesk-Regular': require('./assets/fonts/SpaceGrotesk-Regular.ttf'),
    'SourceCodePro-Regular': require('./assets/fonts/SourceCodePro-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Lade Schriftarten...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.primary,
    fontSize: 20,
    fontFamily: FONTS.body, // Use a loaded font for loading text
  },
});

export default App;
