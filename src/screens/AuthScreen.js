import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../initFirebase";

export default function AuthScreen() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const go = async () => {
    setBusy(true);
    setErr("");
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#111", padding: 24, justifyContent: "center" }}>
      <Text style={{ color: "#09f", fontSize: 26, fontWeight: "700", marginBottom: 12 }}>
        {mode === "signup" ? "Account erstellen" : "Anmelden"}
      </Text>

      <TextInput
        placeholder="E-Mail"
        placeholderTextColor="#777"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{
          color: "#fff",
          borderColor: "#333",
          borderWidth: 1,
          padding: 12,
          borderRadius: 10,
          marginBottom: 10,
          backgroundColor: "#1a1a1a",
        }}
      />

      <TextInput
        placeholder="Passwort"
        placeholderTextColor="#777"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{
          color: "#fff",
          borderColor: "#333",
          borderWidth: 1,
          padding: 12,
          borderRadius: 10,
          marginBottom: 16,
          backgroundColor: "#1a1a1a",
        }}
      />

      {err ? <Text style={{ color: "#f55", marginBottom: 10 }}>{err}</Text> : null}

      <TouchableOpacity
        onPress={go}
        disabled={busy || !email || !password}
        style={{
          backgroundColor: busy ? "#2b6" : "#0ab",
          padding: 14,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        {busy ? <ActivityIndicator /> : <Text style={{ color: "#fff", fontWeight: "700" }}>
          {mode === "signup" ? "Registrieren" : "Einloggen"}
        </Text>}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setMode(mode === "signup" ? "login" : "signup")}
        style={{ marginTop: 16 }}
      >
        <Text style={{ color: "#bbb" }}>
          {mode === "signup"
            ? "Schon einen Account? Jetzt einloggen"
            : "Neu hier? Account erstellen"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
