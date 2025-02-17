// app/ViewWorkgroupDetails.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { db } from '../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';

interface Workgroup {
  name: string;
  owner: string;
  admins: string[];
  members: string[];
}

const ViewWorkgroupDetails: React.FC = () => {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [workgroup, setWorkgroup] = useState<Workgroup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkgroup = async () => {
      if (!groupId) return;
      try {
        const docRef = doc(db, 'workgroups', groupId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            setWorkgroup({
                id: docSnap.id,
                name: docSnap.data().name || '',
                owner: docSnap.data().owner || '',
                admins: docSnap.data().admins || [],
                members: docSnap.data().members || []
              } as Workgroup);
        }
      } catch (error) {
        console.error('Error fetching workgroup details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkgroup();
  }, [groupId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando detalles del grupo...</Text>
      </View>
    );
  }

  if (!workgroup) {
    return (
      <View style={styles.emptyContainer}>
        <Text>Grupo de trabajo no encontrado.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalles del Grupo de Trabajo</Text>
      <Text style={styles.label}>Nombre:</Text>
      <Text>{workgroup.name}</Text>
      <Text style={styles.label}>Dueño:</Text>
      <Text>{workgroup.owner}</Text>
      <Text style={styles.label}>Administradores:</Text>
      <Text>{workgroup.admins.join(', ')}</Text>
      <Text style={styles.label}>Miembros:</Text>
      <Text>{workgroup.members.join(', ')}</Text>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.backButton}>Volver</Text>
      </TouchableOpacity>
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
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  backButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#007BFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
});

export default ViewWorkgroupDetails;