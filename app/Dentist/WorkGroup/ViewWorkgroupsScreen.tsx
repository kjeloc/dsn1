import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { db } from '../../../config/firebaseConfig';
import { collection, getDocs,getDoc, doc, query, where, } from 'firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Workgroup } from "../../utils/types";

const ViewWorkgroupsScreen: React.FC = () => {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { dentistEmail } = useLocalSearchParams<{ dentistEmail: string }>();
  const [workgroups, setWorkgroups] = useState<Workgroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkgroups = async () => {
    
      try {
        const userEmail = dentistEmail;

        if (!userEmail) return;

        const q = query(collection(db, 'workgroups'),(where('memberEmails', 'array-contains', userEmail)));
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
    router.push(`/ViewWorkgroupDetails?groupId=${groupId}`);
  };

  const handleViewGroupChats = (groupId: string) => {
    router.push(`/GroupChatScreen?groupId=${groupId}&userId=${userId}`);
  };
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando grupos de trabajo...</Text>
      </View>
    );
  }

  if (workgroups.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text>No perteneces a ningún grupo de trabajo.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Grupos de Trabajo</Text>
      <FlatList
        data={workgroups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleViewGroupChats(item.id)}>
            <View style={styles.workgroupItem}>
              <Text style={styles.workgroupName}>{item.name}</Text>
              <Text>Dueño: {item.owner}</Text>
              <Text>Administradores: {item.admins.join(', ')}</Text>
              <Text>Miembros: {item.members.join(', ')}</Text>
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
    backgroundColor: '#F9F9F9',
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
    backgroundColor: '#FFF',
    shadowColor: '#000',
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
});

export default ViewWorkgroupsScreen;