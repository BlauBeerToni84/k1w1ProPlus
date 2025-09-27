import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, FlatList, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc, updateDoc, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth, db, storage } from '../firebase/firebaseConfig'; // Assuming auth, db, and storage are exported from here
import { COLORS } from '../theme/colors';
import { FONTS } from '../theme/fonts';

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState(null);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [currentProjectName, setCurrentProjectName] = useState('Kein Projekt ausgewählt');
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const currentUser = auth.currentUser;

  // Load active project ID and Gemini API Key on focus
  useEffect(() => {
    const loadSettings = async () => {
      const storedProjectId = await SecureStore.getItemAsync('activeProjectId');
      if (storedProjectId) {
        setActiveProjectId(storedProjectId);
        // Fetch project name
        const projectDocRef = doc(db, 'projects', storedProjectId);
        const projectDocSnap = await getDoc(projectDocRef);
        if (projectDocSnap.exists()) {
          setCurrentProjectName(projectDocSnap.data().name);
        }
      }

      const storedApiKey = await SecureStore.getItemAsync('geminiApiKey');
      if (storedApiKey) {
        setGeminiApiKey(storedApiKey);
        const genAI = new GoogleGenerativeAI(storedApiKey);
        setGeminiModel(genAI.getGenerativeModel({ model: "gemini-pro" }));
      }
    };
    if (isFocused) {
      loadSettings();
    }
  }, [isFocused]);

  // Fetch user profile
  useEffect(() => {
    if (currentUser) {
      const fetchUserProfile = async () => {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
          setNewDisplayName(docSnap.data().displayName || '');
        }
      };
      fetchUserProfile();
    }
  }, [currentUser]);

  // Fetch chat messages
  useEffect(() => {
    if (!activeProjectId) {
      setMessages([]);
      return;
    }
    const q = query(collection(db, 'chats'), where('projectId', '==', activeProjectId), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs.map((doc) => ({
          _id: doc.id,
          text: doc.data().text,
          createdAt: doc.data().createdAt?.toDate().toLocaleString(),
          user: doc.data().user,
          imageUrl: doc.data().imageUrl, // Include imageUrl
        }))
      );
    });

    return () => unsubscribe();
  }, [activeProjectId]);

  const handleSend = async (imageUrl = null) => {
    if (newMessage.trim() === '' && !imageUrl) return;
    if (!activeProjectId) {
      Alert.alert('Fehler', 'Bitte wählen Sie zuerst ein Projekt aus.');
      return;
    }

    const messageText = newMessage.trim();

    if (messageText.startsWith('/ai ')) {
      await processAICommand(messageText.substring(4)); // Remove '/ai ' prefix
    } else {
      try {
        await addDoc(collection(db, 'chats'), {
          text: messageText,
          createdAt: serverTimestamp(),
          user: {
            _id: currentUser.uid,
            email: currentUser.email,
            displayName: userProfile?.displayName || currentUser.email.split('@')[0],
          },
          imageUrl: imageUrl, // Add imageUrl to message
          projectId: activeProjectId, // Add projectId to message
        });
        setNewMessage('');
      } catch (error) {
        Alert.alert('Fehler beim Senden', error.message);
      }
    }
  };

  const processAICommand = async (command) => {
    setNewMessage(''); // Clear input immediately
    if (!geminiModel) {
      Alert.alert('Fehler', 'Gemini API Key ist nicht konfiguriert.');
      return;
    }
    if (!activeProjectId) {
      Alert.alert('Fehler', 'Bitte wählen Sie zuerst ein Projekt aus.');
      return;
    }
    try {
      const result = await geminiModel.generateContent(command);
      const response = await result.response;
      const text = response.text();

      await addDoc(collection(db, 'chats'), {
        text: text,
        createdAt: serverTimestamp(),
        user: {
          _id: 'AI_BOT',
          email: 'ai@k1w1proplus.com',
          displayName: 'k1w1 AI',
        },
        projectId: activeProjectId, // Add projectId to AI response
      });
    } catch (error) {
      Alert.alert('Fehler bei der KI-Antwort', 'KI-Befehl konnte nicht verarbeitet werden: ' + error.message);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();

    const storageRef = ref(storage, `chat_images/${currentUser.uid}/${Date.now()}`);
    const uploadTask = uploadBytes(storageRef, blob);

    uploadTask.then((snapshot) => {
      getDownloadURL(snapshot.ref).then((downloadURL) => {
        handleSend(downloadURL); // Send message with image URL
      });
    }).catch((error) => {
      Alert.alert('Fehler beim Hochladen', error.message);
    });
  };

  const handleUpdateDisplayName = async () => {
    if (newDisplayName.trim() === '') {
      Alert.alert('Fehler', 'Anzeigename darf nicht leer sein.');
      return;
    }
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        displayName: newDisplayName,
      });
      setUserProfile((prev) => ({ ...prev, displayName: newDisplayName }));
      Alert.alert('Erfolg', 'Anzeigename aktualisiert!');
    } catch (error) {
      Alert.alert('Fehler', 'Anzeigename konnte nicht aktualisiert werden: ' + error.message);
    }
  };

  const handleSaveGeminiApiKey = async () => {
    if (geminiApiKey.trim() === '') {
      Alert.alert('Fehler', 'API Key darf nicht leer sein.');
      return;
    }
    try {
      await SecureStore.setItemAsync('geminiApiKey', geminiApiKey);
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      setGeminiModel(genAI.getGenerativeModel({ model: "gemini-pro" }));
      Alert.alert('Erfolg', 'Gemini API Key gespeichert!');
    } catch (error) {
      Alert.alert('Fehler', 'API Key konnte nicht gespeichert werden: ' + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (error) {
      Alert.alert('Fehler beim Abmelden', error.message);
    }
  };

  const renderMessage = ({ item }) => {
    const isCurrentUser = item.user._id === currentUser.uid;
    const displayUserName = item.user.displayName || item.user.email.split('@')[0];
    const avatarLetter = displayUserName.charAt(0).toUpperCase();

    return (
      <View style={[styles.messageWrapper, isCurrentUser ? styles.currentUserMessageWrapper : styles.otherUserMessageWrapper]}>
        {!isCurrentUser && (
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>
        )}
        <View style={[styles.messageContainer, isCurrentUser ? styles.currentUserMessageContainer : styles.otherUserMessageContainer]}>
          <Text style={styles.messageUser}>{displayUserName}</Text>
          {item.text && <Text style={styles.messageText}>{item.text}</Text>}
          {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.chatImage} />}
          <Text style={styles.messageTime}>{item.createdAt}</Text>
        </View>
        {isCurrentUser && (
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('ProjectSelection')} style={styles.projectSelectButton}>
          <Text style={styles.projectSelectButtonText}>{currentProjectName}</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>Chat</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Abmelden</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        inverted
        style={styles.messageList}
      />

      <View style={styles.profileSection}>
        <Text style={styles.profileHeaderText}>Dein Profil</Text>
        <TextInput
          style={styles.profileInput}
          placeholder="Anzeigename"
          placeholderTextColor={COLORS.gray}
          value={newDisplayName}
          onChangeText={setNewDisplayName}
        />
        <TouchableOpacity style={styles.profileButton} onPress={handleUpdateDisplayName}>
          <Text style={styles.profileButtonText}>Anzeigename aktualisieren</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileSection}>
        <Text style={styles.profileHeaderText}>Gemini API Einstellungen</Text>
        <TextInput
          style={styles.profileInput}
          placeholder="Gemini API Key"
          placeholderTextColor={COLORS.gray}
          value={geminiApiKey}
          onChangeText={setGeminiApiKey}
          secureTextEntry
        />
        <TouchableOpacity style={styles.profileButton} onPress={handleSaveGeminiApiKey}>
          <Text style={styles.profileButtonText}>API Key speichern</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={pickImage} style={styles.imagePickerButton}>
          <Text style={styles.imagePickerButtonText}>Bild</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Nachricht eingeben..."
          placeholderTextColor={COLORS.gray}
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={() => handleSend()}>
          <Text style={styles.sendButtonText}>Senden</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2A',
  },
  headerText: {
    fontFamily: FONTS.headlines,
    fontSize: 24,
    color: COLORS.primary,
  },
  logoutButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  logoutButtonText: {
    color: COLORS.black,
    fontSize: 14,
    fontFamily: FONTS.headlines,
  },
  messageList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  currentUserMessageWrapper: {
    justifyContent: 'flex-end',
  },
  otherUserMessageWrapper: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  avatarText: {
    color: COLORS.black,
    fontFamily: FONTS.code,
    fontSize: 16,
  },
  messageContainer: {
    backgroundColor: '#1A1A2A',
    borderRadius: 10,
    padding: 10,
    maxWidth: '70%',
  },
  currentUserMessageContainer: {
    backgroundColor: COLORS.primary,
  },
  otherUserMessageContainer: {
    backgroundColor: '#1A1A2A',
  },
  messageUser: {
    fontFamily: FONTS.code,
    fontSize: 12,
    color: COLORS.primary,
    marginBottom: 3,
  },
  messageText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.white,
  },
  messageTime: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.gray,
    marginTop: 5,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#1A1A2A',
    backgroundColor: COLORS.background,
  },
  input: {
    flex: 1,
    backgroundColor: '#1A1A2A',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.white,
    fontFamily: FONTS.body,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: COLORS.black,
    fontSize: 16,
    fontFamily: FONTS.headlines,
  },
  profileSection: {
    padding: 15,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: '#1A1A2A',
    alignItems: 'center',
  },
  profileHeaderText: {
    fontFamily: FONTS.headlines,
    fontSize: 18,
    color: COLORS.primary,
    marginBottom: 10,
  },
  profileInput: {
    width: '100%',
    backgroundColor: '#1A1A2A',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: COLORS.white,
    fontFamily: FONTS.body,
    marginBottom: 10,
  },
  profileButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  profileButtonText: {
    color: COLORS.black,
    fontSize: 16,
    fontFamily: FONTS.headlines,
  },
  imagePickerButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  imagePickerButtonText: {
    color: COLORS.black,
    fontSize: 16,
    fontFamily: FONTS.headlines,
  },
  chatImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginTop: 5,
    resizeMode: 'cover',
  },
  projectSelectButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  projectSelectButtonText: {
    color: COLORS.black,
    fontSize: 14,
    fontFamily: FONTS.headlines,
  },
});

export default ChatScreen;