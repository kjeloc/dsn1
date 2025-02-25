import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { db } from '../../../config/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Workgroup } from "../../utils/types";

const ViewWorkgroupsScreen: React.FC = () => {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { dentistEmail } = useLocalSearchParams<{ dentistEmail: string }>();
  const [workgroups, setWorkgroups] = useState<Workgroup[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme(); // Detectar el esquema de color del dispositivo

  useEffect(() => {
    const fetchWorkgroups = async () => {
      try {
        const userEmail = dentistEmail;
        if (!userEmail) return;
        const q = query(collection(db, 'workgroups'), where('memberEmails', 'array-contains', userEmail));
        const querySnapshot = await getDocs(q);
        const workgroupsData: Workgroup[] = [];
        querySnapshot.forEach((doc) => {
          workgroupsData.push({
            id: doc.id,
            name: doc.data().groupName || '',
            owner: doc.data().ownerEmail || '',
            admins: doc.data().adminEmails || [],
            members: doc.data().memberEmails || []
          } as Workgroup);
        });
        setWorkgroups(workgroupsData);
      } catch (error) {
        console.error('Error fetching workgroups:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkgroups();
  }, [dentistEmail]);

  const handleViewGroup = (groupId: string) => {
    router.push(`/Dentist/WorkGroup/ViewWorkgroupDetails?groupId=${groupId}`);
  };

  const handleViewGroupChats = (groupId: string) => {
    router.push(`/Dentist/WorkGroup/GroupChatScreen?groupId=${groupId}&userId=${userId}`);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colorScheme === 'dark' ? '#121212' : '#F9F9F9' }]}>
        <Text style={{ color: colorScheme === 'dark' ? '#fff' : '#000' }}>Cargando grupos de trabajo...</Text>
      </View>
    );
  }

  if (workgroups.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colorScheme === 'dark' ? '#121212' : '#F9F9F9' }]}>
        <Text style={{ color: colorScheme === 'dark' ? '#fff' : '#000' }}>No perteneces a ningún grupo de trabajo.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#121212' : '#F9F9F9' }]}>
      <Text style={[styles.title, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>Grupos de Trabajo</Text>
      <FlatList
        data={workgroups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleViewGroupChats(item.id)}>
            <View
              style={[
                styles.workgroupItem,
                {
                  backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#FFF',
                  shadowColor: colorScheme === 'dark' ? '#000' : '#ccc',
                },
              ]}
            >
              <Text style={[styles.workgroupName, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>{item.name}</Text>
              <Text style={{ color: colorScheme === 'dark' ? '#bbb' : '#333' }}>Dueño: {item.owner}</Text>
              <Text style={{ color: colorScheme === 'dark' ? '#bbb' : '#333' }}>
                Administradores: {item.admins.join(', ') || "Ninguno"}
              </Text>
              <Text style={{ color: colorScheme === 'dark' ? '#bbb' : '#333' }}>
                Miembros: {item.members.join(', ') || "Ninguno"}
              </Text>
              <TouchableOpacity
                style={[
                  styles.detailsButton,
                  { backgroundColor: colorScheme === 'dark' ? '#761FE0' : '#007BFF' },
                ]}
                onPress={() => handleViewGroup(item.id)}
              >
                <Text style={styles.detailsButtonText}>Ver Detalles</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workgroupItem: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workgroupName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  detailsButton: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ViewWorkgroupsScreen;