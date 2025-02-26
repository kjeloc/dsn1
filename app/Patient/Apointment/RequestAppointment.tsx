import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import { useLocalSearchParams } from "expo-router";
import { db } from "../../../config/firebaseConfig";
import { PatientData } from "../../utils/types";

const RequestAppointment: React.FC = () => {
  const { userId } = useLocalSearchParams();
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDentist, setSelectedDentist] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!userId) return;
      try {
        const userDoc = await getDoc(doc(db, "userTest", userId as string));
        if (userDoc.exists()) {
          const data = userDoc.data() as PatientData;
          setPatientData(data);
          if (data.dentists && data.dentists.length > 0) {
            setSelectedDentist(data.dentists[0]); // Seleccionar el primer dentista por defecto
          }
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

  const handleRequestAppointment = async () => {
    if (!patientData || !selectedDentist || !reason.trim()) {
      Alert.alert("Error", "Por favor completa todos los campos.");
      return;
    }

    setSubmitting(true);
    try {
      const currentDate = new Date().toISOString().split("T")[0]; // Formato yyyy-mm-dd
      const appointmentData = {
        date: currentDate,
        dentistEmail: selectedDentist,
        patientEmail: patientData.email,
        reason: reason.trim(),
        status: "En espera",
      };

      // Guardar en Firebase
      await addDoc(collection(db, "Appointment_request"), appointmentData);

      Alert.alert("Éxito", "Tu solicitud de cita ha sido enviada.");
      setReason(""); // Limpiar el campo de motivo
    } catch (error) {
      console.error("Error al guardar la solicitud de cita:", error);
      Alert.alert("Error", "Ocurrió un error al enviar la solicitud.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!patientData) {
    return (
      <View style={styles.container}>
        <Text>No se encontraron datos del paciente.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Solicitar Cita</Text>

      {/* Lista de Dentistas */}
      <Text style={styles.label}>Selecciona un dentista:</Text>
      {patientData.dentists && patientData.dentists.length > 0 ? (
        patientData.dentists.map((dentistEmail, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dentistButton,
              selectedDentist === dentistEmail && styles.selectedDentistButton,
            ]}
            onPress={() => setSelectedDentist(dentistEmail)}
          >
            <Text>{dentistEmail}</Text>
          </TouchableOpacity>
        ))
      ) : (
        <Text>No hay dentistas disponibles.</Text>
      )}

      {/* Motivo de la Cita */}
      <Text style={styles.label}>Motivo de la cita:</Text>
      <TextInput
        style={styles.input}
        placeholder="Escribe el motivo de tu cita"
        value={reason}
        onChangeText={setReason}
        multiline
      />

      {/* Botón de Envío */}
      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleRequestAppointment}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.submitButtonText}>Enviar Solicitud</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },
  dentistButton: {
    padding: 10,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  selectedDentistButton: {
    backgroundColor: "#007bff",
  },
  input: {
    height: 100,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default RequestAppointment;