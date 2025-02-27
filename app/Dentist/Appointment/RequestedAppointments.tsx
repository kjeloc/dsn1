import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useColorScheme,
} from "react-native";
import { collection, query, where, getDocs, doc, updateDoc, addDoc, getDoc } from "firebase/firestore";
import { db } from "../../../config/firebaseConfig";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";

interface AppointmentRequest {
  id: string;
  date: string;
  dentistEmail: string;
  patientEmail: string;
  reason: string;
  status: string;
}

const RequestedAppointments: React.FC = () => {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme(); // Detectar el esquema de color del dispositivo

  // Función para registrar logs
  const logAction = async (userId: string, action: string) => {
    try {
      await addDoc(collection(db, "logs"), {
        userId: userId,
        action: action,
        timestamp: new Date(), // Fecha y hora actual
      });
      console.log("Log registrado correctamente:", action);
    } catch (error) {
      console.error("Error al registrar el log:", error);
    }
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!userId) return;
      try {
        // Obtener el correo del dentista desde Firestore
        const dentistDoc = await getDoc(doc(db, "userTest", userId as string));
        if (!dentistDoc.exists()) {
          console.error("El documento del dentista no existe");
          setLoading(false);
          return;
        }
        const dentistEmail = dentistDoc.data()?.email;

        // Consultar las citas solicitadas con estado "En espera"
        const q = query(
          collection(db, "Appointment_request"),
          where("dentistEmail", "==", dentistEmail),
          where("status", "==", "En espera")
        );
        const querySnapshot = await getDocs(q);
        const appointmentsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as AppointmentRequest[];
        setAppointments(appointmentsData);
      } catch (error) {
        console.error("Error al obtener las citas solicitadas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [userId]);

  const handleUpdateStatus = async (appointmentId: string, newStatus: string, patientEmail: string) => {
    try {
      const appointmentRef = doc(db, "Appointment_request", appointmentId);
      await updateDoc(appointmentRef, { status: newStatus });

      // Registrar log según la acción realizada
      const action = newStatus === "Atendida" ? "Cita aceptada" : "Cita rechazada";
      await logAction(userId as string, action);

      Alert.alert("Éxito", `La cita ha sido ${newStatus === "Atendida" ? "aceptada" : "rechazada"}.`);
      if (newStatus === "Atendida") {
        router.push(`/Dentist/Appointment/CompleteAppointment?userId=${userId}&patientEmail=${patientEmail}`);
      }
      setAppointments((prev) => prev.filter((appointment) => appointment.id !== appointmentId));
    } catch (error) {
      console.error("Error al actualizar el estado de la cita:", error);
      Alert.alert("Error", "No se pudo actualizar el estado de la cita.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colorScheme === "dark" ? "#121212" : "#fff" }]}>
        <ActivityIndicator size="large" color={colorScheme === "dark" ? "#fff" : "#0000ff"} />
      </View>
    );
  }

  if (appointments.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colorScheme === "dark" ? "#121212" : "#f5f5f5" }]}>
        <Text style={{ color: colorScheme === "dark" ? "#fff" : "#000" }}>No hay citas solicitadas en espera.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === "dark" ? "#121212" : "#f5f5f5" }]}>
      {/* Título */}
      <Text style={[styles.title, { color: colorScheme === "dark" ? "#fff" : "#000" }]}>Citas Solicitadas</Text>

      {/* Lista de Citas */}
      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.appointmentCard,
              {
                backgroundColor: colorScheme === "dark" ? "#1e1e1e" : "#fff",
                shadowColor: colorScheme === "dark" ? "#000" : "#ccc",
              },
            ]}
          >
            <Text style={[styles.label, { color: colorScheme === "dark" ? "#fff" : "#000" }]}>Fecha:</Text>
            <Text style={{ color: colorScheme === "dark" ? "#fff" : "#000" }}>{item.date}</Text>
            <Text style={[styles.label, { color: colorScheme === "dark" ? "#fff" : "#000" }]}>Paciente:</Text>
            <Text style={{ color: colorScheme === "dark" ? "#fff" : "#000" }}>{item.patientEmail}</Text>
            <Text style={[styles.label, { color: colorScheme === "dark" ? "#fff" : "#000" }]}>Motivo:</Text>
            <Text style={{ color: colorScheme === "dark" ? "#fff" : "#000" }}>{item.reason}</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.acceptButton]}
                onPress={() => handleUpdateStatus(item.id, "Atendida", item.patientEmail)}
              >
                <Text style={styles.buttonText}>Aceptar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.rejectButton]}
                onPress={() => handleUpdateStatus(item.id, "Rechazada", item.patientEmail)}
              >
                <Text style={styles.buttonText}>Rechazar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  appointmentCard: {
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
  },
  acceptButton: {
    backgroundColor: "#28a745",
  },
  rejectButton: {
    backgroundColor: "#dc3545",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  listContent: {
    flexGrow: 1,
  },
});

export default RequestedAppointments;