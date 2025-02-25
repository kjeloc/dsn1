import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { db } from '../../../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Workgroup } from "../../utils/types";

const ViewWorkgroupDetails: React.FC = () => {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [workgroup, setWorkgroup] = useState<Workgroup | null>(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme(); // Detectar el esquema de color del dispositivo

  useEffect(() => {
    const fetchWorkgroup = async () => {
      if (!groupId) return;
      try {
        console.log("Buscando detalles del grupo con ID:", groupId); // Depuración
        const docRef = doc(db, 'workgroups', groupId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("Datos encontrados en Firestore:", data); // Depuración

          // Asegúrate de usar los nombres correctos de los campos en Firestore
          setWorkgroup({
            id: docSnap.id,
            name: data.groupName || '', // Verifica si en Firestore es "groupName"
            owner: data.ownerEmail || '', // Verifica si en Firestore es "ownerEmail"
            admins: data.adminEmails || [], // Verifica si en Firestore es "adminEmails"
            members: data.memberEmails || [] // Verifica si en Firestore es "memberEmails"
          } as Workgroup);
        } else {
          console.error(`Documento no encontrado para el ID: ${groupId}`);
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
      <View style={[styles.loadingContainer, { backgroundColor: colorScheme === 'dark' ? '#121212' : '#F9F9F9' }]}>
        <Text style={{ color: colorScheme === 'dark' ? '#fff' : '#000' }}>Cargando detalles del grupo...</Text>
      </View>
    );
  }

  if (!workgroup) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colorScheme === 'dark' ? '#121212' : '#F9F9F9' }]}>
        <Text style={{ color: colorScheme === 'dark' ? '#fff' : '#000' }}>Grupo de trabajo no encontrado.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#121212' : '#F9F9F9' }]}>
      <Text style={[styles.title, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>Detalles del Grupo de Trabajo</Text>

      <Text style={[styles.label, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>Nombre:</Text>
      <Text style={{ color: colorScheme === 'dark' ? '#bbb' : '#333' }}>{workgroup.name}</Text>

      <Text style={[styles.label, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>Dueño:</Text>
      <Text style={{ color: colorScheme === 'dark' ? '#bbb' : '#333' }}>{workgroup.owner}</Text>

      <Text style={[styles.label, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>Administradores:</Text>
      <Text style={{ color: colorScheme === 'dark' ? '#bbb' : '#333' }}>{workgroup.admins.join(', ') || "Ninguno"}</Text>

      <Text style={[styles.label, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>Miembros:</Text>
      <Text style={{ color: colorScheme === 'dark' ? '#bbb' : '#333' }}>{workgroup.members.join(', ') || "Ninguno"}</Text>

      <TouchableOpacity
        style={[
          styles.backButton,
          { backgroundColor: colorScheme === 'dark' ? '#761FE0' : '#007BFF' },
        ]}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>Volver</Text>
      </TouchableOpacity>
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
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  backButton: {
    marginTop: 20,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
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