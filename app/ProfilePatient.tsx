// app/ProfilePatient.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { db } from "../config/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useLocalSearchParams } from "expo-router";

interface PatientData {
  name: string;
  email: string;
  birthdate: string;
  age?: number;
  appointments: {
    date: string;
    hour: string;
    reason: string;
    dentalOffice: string;
    dentistEmail: string;
  }[];
}

const ProfilePatient: React.FC = () => {
  const { userId } = useLocalSearchParams();
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!userId) return;
      try {
        const userDoc = await getDoc(doc(db, "userTest", userId as string));
        if (userDoc.exists()) {
          const data = userDoc.data();
          console.log("Datos del paciente:", data); // Depuración
          if (!data) {
            console.error("Los datos del paciente son undefined");
            return;
          }
          setPatientData(data as PatientData);
        } else {
          console.error("El documento del paciente no existe");
        }
      } catch (error) {
        console.error("Error al obtener los datos del paciente:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatientData();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  if (!patientData) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No se encontraron datos del paciente.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Perfil del Paciente</Text>

      {/* Nombre */}
      <View style={styles.infoSection}>
        <Text style={styles.label}>Nombre:</Text>
        <Text style={styles.value}>{patientData.name}</Text>
      </View>

      {/* Correo Electrónico */}
      <View style={styles.infoSection}>
        <Text style={styles.label}>Correo Electrónico:</Text>
        <Text style={styles.value}>{patientData.email}</Text>
      </View>

      {/* Fecha de Nacimiento */}
      <View style={styles.infoSection}>
        <Text style={styles.label}>Fecha de Nacimiento:</Text>
        <Text style={styles.value}>{patientData.birthdate}</Text>
      </View>

      {/* Edad */}
      <View style={styles.infoSection}>
        <Text style={styles.label}>Edad:</Text>
        <Text style={styles.value}>{patientData.age || "No especificada"}</Text>
      </View>

      {/* Citas Programadas */}
      <View style={styles.infoSection}>
        <Text style={styles.label}>Citas Programadas:</Text>
        {patientData?.appointments?.length > 0 ? (
          patientData.appointments.map((appointment, index) => (
            <Text key={index} style={styles.value}>
              - {appointment.date} ({appointment.reason})
            </Text>
          ))
        ) : (
          <Text style={styles.value}>No hay citas programadas.</Text>
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

export default ProfilePatient;