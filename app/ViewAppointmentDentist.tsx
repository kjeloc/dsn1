import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

interface Appointment {
  id: string;
  patientEmail: string;
  date: string;
  hour: string;
  reason: string;
  dentalOffice: string;
  dentistEmail: string;
}

const ViewAppointmentDentist: React.FC = () => {
  const params = useLocalSearchParams();
  const appointment = JSON.parse(params.appointment as string) as Appointment;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalles de la Cita</Text>

      <View style={styles.detailContainer}>
        <Text style={styles.label}>Paciente:</Text>
        <Text style={styles.value}>{appointment.patientEmail}</Text>
      </View>

      <View style={styles.detailContainer}>
        <Text style={styles.label}>Fecha:</Text>
        <Text style={styles.value}>{appointment.date}</Text>
      </View>

      <View style={styles.detailContainer}>
        <Text style={styles.label}>Hora:</Text>
        <Text style={styles.value}>{appointment.hour}</Text>
      </View>

      <View style={styles.detailContainer}>
        <Text style={styles.label}>Consultorio:</Text>
        <Text style={styles.value}>{appointment.dentalOffice}</Text>
      </View>

      <View style={styles.detailContainer}>
        <Text style={styles.label}>Motivo:</Text>
        <Text style={styles.value}>{appointment.reason}</Text>
      </View>

      <View style={styles.detailContainer}>
        <Text style={styles.label}>Dentista:</Text>
        <Text style={styles.value}>{appointment.dentistEmail}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F9F9F9",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  detailContainer: {
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

export default ViewAppointmentDentist;