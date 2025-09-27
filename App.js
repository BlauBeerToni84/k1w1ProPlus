import './src/initFirebase';
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
    alignItems: 'center',
    backgroundColor: COLORS.background,
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.primary,
    fontFamily: FONTS.body,
    fontSize: 20, // Use a loaded font for loading text
  },
});

export default App;
