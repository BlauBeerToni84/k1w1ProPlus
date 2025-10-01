import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./initFirebase";

export default function AuthGate({ children, fallback }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => setReady(true));
    return unsub;
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8, color: "#999" }}>Initialisiere Firebase…</Text>
      </View>
    );
  }
  return children ?? fallback ?? null;
}
