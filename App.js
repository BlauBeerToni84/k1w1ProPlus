import "./src/initFirebase";

import React from "react";
import { View, Text } from "react-native";

export default function App() {
  return (
    <View style={{ flex: 1, backgroundColor: "#0f1115", justifyContent: "center", padding: 24 }}>
      <Text style={{ fontSize: 28, color: "#1fb6ff", fontWeight: "700" }}>🔥 K1W1 Pro+ läuft mit Firebase!</Text>
      <Text style={{ marginTop: 12, fontSize: 18, color: "#cfd3dc" }}>
        Wenn du das hier siehst, ist Firebase korrekt initialisiert.
      </Text>
    </View>
  );
}
