import React, { useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Button, StyleSheet, Text, TouchableOpacity, View, Modal } from 'react-native';

const QRScannerScreen: React.FC = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [appointmentData, setAppointmentData] = useState<any>(null);

  // Función para validar la fecha de la cita
  const validateAppointmentDate = (date: string): string => {
    const today = new Date();
    const appointmentDate = new Date(date);
    const isToday = appointmentDate.toDateString() === today.toDateString();

    if (appointmentDate < today) return "Cita expirada";
    if (isToday) return "La cita es hoy";
    return `Esta cita será el ${appointmentDate.toLocaleDateString()}`;
  };

  // Función para manejar el escaneo del QR
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    try {
      const parsedData = JSON.parse(data);
      if (
        parsedData.id &&
        parsedData.dentistEmail &&
        parsedData.date &&
        parsedData.patientEmail &&
        parsedData.hour &&
        parsedData.dentalOffice &&
        parsedData.reason
      ) {
        setAppointmentData(parsedData);
        setScanned(true);
        setModalVisible(true);
      } else {
        throw new Error("Datos del QR no válidos");
      }
    } catch (error) {
      alert("Error al escanear el QR: " + (error as Error).message);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Se necesita otorgar permisos de la cámara a la aplicación</Text>
        <Button onPress={requestPermission} title="Conceder Permiso" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.qrFrame}>
          <Text style={styles.qrFrameText}>Escanea el código QR aquí</Text>
        </View>
      </CameraView>

      {/* Modal para mostrar los detalles de la cita */}
      <Modal visible={isModalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>¡Cita Escaneada!</Text>
          {appointmentData ? (
            <>
              <Text style={styles.modalText}>{validateAppointmentDate(appointmentData.date)}</Text>
              <Text style={styles.modalDetail}><Text style={styles.boldText}>ID:</Text> {appointmentData.id}</Text>
              <Text style={styles.modalDetail}><Text style={styles.boldText}>Odontólogo:</Text> {appointmentData.dentistEmail}</Text>
              <Text style={styles.modalDetail}><Text style={styles.boldText}>Fecha:</Text> {appointmentData.date}</Text>
              <Text style={styles.modalDetail}><Text style={styles.boldText}>Paciente:</Text> {appointmentData.patientEmail}</Text>
              <Text style={styles.modalDetail}><Text style={styles.boldText}>Hora:</Text> {appointmentData.hour}</Text>
              <Text style={styles.modalDetail}><Text style={styles.boldText}>Consultorio:</Text> {appointmentData.dentalOffice}</Text>
              <Text style={styles.modalDetail}><Text style={styles.boldText}>Motivo:</Text> {appointmentData.reason}</Text>
            </>
          ) : (
            <Text style={styles.modalText}>El código QR no contiene una cita válida.</Text>
          )}
          <Button title="Cerrar" onPress={() => setModalVisible(false)} />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  qrFrame: {
    position: "absolute",
    top: "30%",
    left: "10%",
    right: "10%",
    height: "40%",
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  qrFrameText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalContent: {
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
  },
  modalDetail: {
    fontSize: 16,
    marginBottom: 10,
  },
  boldText: {
    fontWeight: "bold",
  },
  message: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    margin: 20,
  },
});

export default QRScannerScreen;