// app/ProfileDentist.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { db } from "../config/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useLocalSearchParams } from "expo-router";

interface DentistData {
  name: string;
  email: string;
  birthdate: string;
  dental_office: string[];
  patients: string[];
  state: string;
}

const ProfileDentist: React.FC = () => {
  const { userId } = useLocalSearchParams();
  const [dentistData, setDentistData] = useState<DentistData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDentistData = async () => {
      if (!userId) return;
      try {
        const userDoc = await getDoc(doc(db, "userTest", userId as string));
        if (userDoc.exists()) {
          const data = userDoc.data() as DentistData;
          setDentistData(data);
        } else {
          console.error("El documento del dentista no existe");
        }
      } catch (error) {
        console.error("Error al obtener los datos del dentista:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDentistData();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  if (!dentistData) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No se encontraron datos del dentista.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Perfil del Dentista</Text>

      {/* Nombre */}
      <View style={styles.infoSection}>
        <Text style={styles.label}>Nombre:</Text>
        <Text style={styles.value}>{dentistData.name}</Text>
      </View>

      {/* Correo Electrónico */}
      <View style={styles.infoSection}>
        <Text style={styles.label}>Correo Electrónico:</Text>
        <Text style={styles.value}>{dentistData.email}</Text>
      </View>

      {/* Fecha de Nacimiento */}
      <View style={styles.infoSection}>
        <Text style={styles.label}>Fecha de Nacimiento:</Text>
        <Text style={styles.value}>{dentistData.birthdate}</Text>
      </View>

      {/* Estado */}
      <View style={styles.infoSection}>
        <Text style={styles.label}>Estado:</Text>
        <Text style={styles.value}>{dentistData.state}</Text>
      </View>

      {/* Consultorios */}
      <View style={styles.infoSection}>
        <Text style={styles.label}>Consultorios Asignados:</Text>
        {dentistData.dental_office.length > 0 ? (
          dentistData.dental_office.map((office, index) => (
            <Text key={index} style={styles.value}>
              - {office}
            </Text>
          ))
        ) : (
          <Text style={styles.value}>No hay consultorios asignados.</Text>
        )}
      </View>

      {/* Pacientes */}
      <View style={styles.infoSection}>
        <Text style={styles.label}>Pacientes Asociados:</Text>
        {dentistData.patients.length > 0 ? (
          dentistData.patients.map((patient, index) => (
            <Text key={index} style={styles.value}>
              - {patient}
            </Text>
          ))
        ) : (
          <Text style={styles.value}>No hay pacientes asociados.</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F9F9F9",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  infoSection: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  value: {
    fontSize: 16,
    color: "#555",
    marginTop: 5,
  },
});

export default ProfileDentist;