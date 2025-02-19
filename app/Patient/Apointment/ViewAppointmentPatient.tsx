import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import QRCode from 'react-native-qrcode-svg';
import ViewShot from "react-native-view-shot";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Appointment } from "../../utils/types";

const ViewAppointmentPatient: React.FC = () => {
  const params = useLocalSearchParams();
  const appointment = JSON.parse(params.appointment as string) as Appointment;
  const viewShotRef = React.useRef<ViewShot>(null);

  const qrData = JSON.stringify(appointment);

  const saveQRCode = async () => {
    if (!viewShotRef.current || !viewShotRef.current.capture) {
      Alert.alert("Error", "No se pudo capturar el código QR.");
      return;
    }

    try {
      const uri = await viewShotRef.current.capture();

      if (Platform.OS === "web") {
        const link = document.createElement("a");
        link.href = uri;
        link.download = `cita-${appointment.id}.png`;
        link.click();
      } else {
        const fileUri = `${FileSystem.documentDirectory}cita-${appointment.id}.png`;
        await FileSystem.copyAsync({ from: uri, to: fileUri });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert("Imagen guardada", `La imagen se ha guardado en: ${fileUri}`);
        }
      }
    } catch (error) {
      console.error("Error al guardar el código QR:", error);
      Alert.alert("Error", "No se pudo guardar el código QR.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Detalles de la Cita</Text>

        {/* Tabla 2x3 */}
        <View style={styles.table}>
          {/* Fila 1 */}
          <View style={styles.row}>
            <View style={styles.cell}>
              <Text style={styles.label}>Fecha:</Text>
              <Text style={styles.value}>{appointment.date}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.label}>Hora:</Text>
              <Text style={styles.value}>{appointment.hour}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.label}>Motivo:</Text>
              <Text style={styles.value}>{appointment.reason}</Text>
            </View>
          </View>

          {/* Fila 2 */}
          <View style={styles.row}>
            <View style={styles.cell}>
              <Text style={styles.label}>Consultorio:</Text>
              <Text style={styles.value}>{appointment.dentalOffice}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.label}>Dentista:</Text>
              <Text style={styles.value}>{appointment.dentistEmail}</Text>
            </View>
            <View style={styles.cell}>
              {/* Celda vacía o adicional */}
              <Text style={styles.label}> </Text>
              <Text style={styles.value}> </Text>
            </View>
          </View>
        </View>

        {/* Sección del código QR */}
        <View style={styles.qrContainer}>
          <Text style={styles.qrTitle}>Código QR de la Cita</Text>
          <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1 }}>
            <QRCode value={qrData} size={200} />
          </ViewShot>
          <TouchableOpacity style={styles.saveButton} onPress={saveQRCode}>
            <Text style={styles.saveButtonText}>Guardar QR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
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
  table: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cell: {
    flex: 1,
    margin: 5,
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  value: {
    fontSize: 14,
    color: "#555",
    marginTop: 5,
  },
  qrContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ViewAppointmentPatient;