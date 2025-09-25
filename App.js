import React, { useState } from 'react';
import { SafeAreaView, StatusBar, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <SafeAreaView style={styles.wrap}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.h1}>K1W1 Pro+</Text>
      <Text style={styles.p}>🎉 Build OK. Du bist live im JavaScript-Code.</Text>

      <TouchableOpacity onPress={() => setCount(c => c + 1)} style={styles.btn}>
        <Text style={styles.btnText}>Tap me ({count})</Text>
      </TouchableOpacity>

      <Text style={[styles.p, {opacity:0.6, marginTop:12}]}>
        Datei: App.js — ändere mich & pushe, dann baut GitHub Actions neu.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12, backgroundColor: '#fff' },
  h1: { fontSize: 28, fontWeight: '700' },
  p: { fontSize: 16, textAlign: 'center' },
  btn: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  btnText: { fontSize: 16, fontWeight: '600' },
});
