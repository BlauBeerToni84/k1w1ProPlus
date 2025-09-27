import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import * as SecureStore from 'expo-secure-store';
import { COLORS } from '../theme/colors';
import { FONTS } from '../theme/fonts';

const ProjectSelectionScreen = () => {
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const navigation = useNavigation();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchProjects = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const q = query(collection(db, 'projects'), where('ownerId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        const fetchedProjects = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProjects(fetchedProjects);

        const storedActiveProjectId = await SecureStore.getItemAsync('activeProjectId');
        if (storedActiveProjectId && fetchedProjects.some(p => p.id === storedActiveProjectId)) {
          setActiveProjectId(storedActiveProjectId);
        } else if (fetchedProjects.length > 0) {
          setActiveProjectId(fetchedProjects[0].id);
          await SecureStore.setItemAsync('activeProjectId', fetchedProjects[0].id);
        }
      } catch (error) {
        Alert.alert('Fehler', 'Projekte konnten nicht geladen werden: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [currentUser]);

  const handleCreateProject = async () => {
    if (newProjectName.trim() === '') {
      Alert.alert('Fehler', 'Projektname darf nicht leer sein.');
      return;
    }
    setLoading(true);
    try {
      const projectRef = collection(db, 'projects');
      const newProject = {
        name: newProjectName,
        ownerId: currentUser.uid,
        createdAt: new Date(),
      };
      const docRef = await addDoc(projectRef, newProject);
      setProjects(prev => [...prev, { id: docRef.id, ...newProject }]);
      setNewProjectName('');
      Alert.alert('Erfolg', 'Projekt erstellt!');

      // Automatically set as active project if it's the first or selected
      if (projects.length === 0 || !activeProjectId) {
        setActiveProjectId(docRef.id);
        await SecureStore.setItemAsync('activeProjectId', docRef.id);
      }
    } catch (error) {
      Alert.alert('Fehler', 'Projekt konnte nicht erstellt werden: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = async (projectId) => {
    setActiveProjectId(projectId);
    await SecureStore.setItemAsync('activeProjectId', projectId);
    Alert.alert('Projekt ausgewählt', `Projekt ${projects.find(p => p.id === projectId)?.name} ausgewählt.`);
    navigation.navigate('Chat'); // Navigate to Chat screen after selection
  };

  const renderProjectItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.projectItem, item.id === activeProjectId && styles.activeProjectItem]}
      onPress={() => handleSelectProject(item.id)}
    >
      <Text style={styles.projectItemText}>{item.name}</Text>
      {item.id === activeProjectId && <Text style={styles.activeIndicator}>(aktiv)</Text>}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Lade Projekte...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headline}>Deine Projekte</Text>

      <View style={styles.createProjectContainer}>
        <TextInput
          style={styles.input}
          placeholder="Neuer Projektname"
          placeholderTextColor={COLORS.gray}
          value={newProjectName}
          onChangeText={setNewProjectName}
        />
        <TouchableOpacity style={styles.createButton} onPress={handleCreateProject}>
          <Text style={styles.createButtonText}>Projekt erstellen</Text>
        </TouchableOpacity>
      </View>

      {projects.length > 0 ? (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          renderItem={renderProjectItem}
          style={styles.projectList}
        />
      ) : (
        <Text style={styles.noProjectsText}>Noch keine Projekte. Erstelle eins!</Text>
      )}

      {activeProjectId && (
        <TouchableOpacity style={styles.goToChatButton} onPress={() => navigation.navigate('Chat')}>
          <Text style={styles.goToChatButtonText}>Zum Chat</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  activeIndicator: {
    color: COLORS.primary,
    fontFamily: FONTS.code,
    fontSize: 14,
  },
  activeProjectItem: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  container: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    flex: 1,
    padding: 20,
  },
  createButton: {
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    padding: 15,
    width: '100%',
  },
  createButtonText: {
    color: COLORS.black,
    fontFamily: FONTS.headlines,
    fontSize: 18,
  },
  createProjectContainer: {
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
  },
  goToChatButton: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginTop: 30,
    padding: 15,
    width: '100%',
  },
  goToChatButtonText: {
    color: COLORS.black,
    fontFamily: FONTS.headlines,
    fontSize: 18,
  },
  headline: {
    color: COLORS.primary,
    fontFamily: FONTS.headlines,
    fontSize: 32,
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#1A1A2A',
    borderRadius: 8,
    color: COLORS.white,
    fontFamily: FONTS.body,
    fontSize: 16,
    marginBottom: 15,
    padding: 15,
    width: '100%',
  },
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.primary,
    fontFamily: FONTS.body,
    fontSize: 20,
  },
  noProjectsText: {
    color: COLORS.gray,
    fontFamily: FONTS.body,
    fontSize: 16,
    marginTop: 20,
  },
  projectItem: {
    alignItems: 'center',
    backgroundColor: '#1A1A2A',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 15,
  },
  projectItemText: {
    color: COLORS.white,
    fontFamily: FONTS.body,
    fontSize: 16,
  },
  projectList: {
    width: '100%',
  },
});

export default ProjectSelectionScreen;
