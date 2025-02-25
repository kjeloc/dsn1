import React from 'react';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useEffect } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Modal, useColorScheme } from 'react-native';
import { useLocalSearchParams } from "expo-router";
import { Appointment } from "../utils/types";

const QRScannerScreen: React.FC = () => {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const { userId, appointments: appointmentsParam } = useLocalSearchParams();
  const colorScheme = useColorScheme(); // Detectar el esquema de color del dispositivo

  useEffect(() => {
    if (appointmentsParam) {
      try {
        const parsedAppointments = JSON.parse(appointmentsParam as string);
        setAppointments(parsedAppointments);
      } catch (error) {
        console.error("Error al parsear las citas:", error);
      }
    }
  }, [appointmentsParam]);

  useEffect(() => {
    if (!permission?.granted) return;
  }, [permission]);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Se necesita otorgar permisos de la cámara a la aplicación</Text>
        <Button onPress={requestPermission} title="Conceder Permiso" />
      </View>
    );
  }

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    try {
      const parsedData = JSON.parse(data);
      if (
        parsedData &&
        parsedData.id &&
        parsedData.dentistEmail &&
        parsedData.date &&
        parsedData.patientEmail &&
        parsedData.hour &&
        parsedData.dentalOffice &&
        parsedData.reason
      ) {
        const isValidAppointment = appointments.some(
          (appointment) =>
            appointment.patientEmail === parsedData.patientEmail &&
            appointment.date === parsedData.date &&
            appointment.hour === parsedData.hour &&
            appointment.dentalOffice === parsedData.dentalOffice &&
            appointment.dentistEmail === parsedData.dentistEmail &&
            appointment.reason === parsedData.reason
        );
        if (isValidAppointment) {
          setAppointmentData(parsedData);
          setScanned(true);
          setModalVisible(true);
        } else {
          throw new Error('La cita no está registrada en el sistema');
        }
      } else {
        throw new Error('Datos del QR no válidos');
      }
    } catch (error) {
      setScanned(true);
      setAppointmentData(null);
      setModalVisible(true);
    }
  };

  const validateAppointmentDate = (appointmentDate: string) => {
    const currentDate = new Date();
    const appointmentDateObj = new Date(appointmentDate);
    const currentDateString = currentDate.toISOString().split('T')[0];
    const appointmentDateString = appointmentDateObj.toISOString().split('T')[0];
    if (appointmentDateString === currentDateString) {
      return "La cita es válida y es hoy";
    } else if (appointmentDateObj < currentDate) {
      return "La cita ya no es válida o ha caducado";
    } else {
      return `La cita es para la fecha indicada: ${appointmentDateString}`;
    }
  };

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#121212' : '#fff' }]}>
      <CameraView
        style={styles.camera}
        facing={facing}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        {/* Recuadro llamativo para escanear el QR */}
        <View style={styles.qrFrame}>
          <Text style={styles.qrFrameText}>Escanea el código QR aquí</Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <Text style={styles.text}>Cambiar Cámara</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colorScheme === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.7)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#121212' : '#fff' }]}>
            <Text style={[styles.modalTitle, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>¡Cita Escaneada!</Text>
            {appointmentData ? (
              <>
                <Text style={[styles.modalText, styles.boldText, { color: colorScheme === 'dark' ? '#ccc' : '#555' }]}>
                  {validateAppointmentDate(appointmentData.date)}
                </Text>
                <Text style={[styles.modalText, styles.boldText, { color: colorScheme === 'dark' ? '#ccc' : '#555' }]}>La cita se ha validado con éxito. Aquí están los detalles:</Text>
                <Text style={[styles.modalDetail, { color: colorScheme === 'dark' ? '#bbb' : '#555' }]}><Text style={styles.boldText}>ID:</Text> {appointmentData.id}</Text>
                <Text style={[styles.modalDetail, { color: colorScheme === 'dark' ? '#bbb' : '#555' }]}><Text style={styles.boldText}>Odontólogo:</Text> {appointmentData.dentistEmail}</Text>
                <Text style={[styles.modalDetail, { color: colorScheme === 'dark' ? '#bbb' : '#555' }]}><Text style={styles.boldText}>Fecha:</Text> {appointmentData.date}</Text>
                <Text style={[styles.modalDetail, { color: colorScheme === 'dark' ? '#bbb' : '#555' }]}><Text style={styles.boldText}>Paciente:</Text> {appointmentData.patientEmail}</Text>
                <Text style={[styles.modalDetail, { color: colorScheme === 'dark' ? '#bbb' : '#555' }]}><Text style={styles.boldText}>Hora:</Text> {appointmentData.hour}</Text>
                <Text style={[styles.modalDetail, { color: colorScheme === 'dark' ? '#bbb' : '#555' }]}><Text style={styles.boldText}>Consultorio:</Text> {appointmentData.dentalOffice}</Text>
                <Text style={[styles.modalDetail, { color: colorScheme === 'dark' ? '#bbb' : '#555' }]}><Text style={styles.boldText}>Motivo:</Text> {appointmentData.reason}</Text>
              </>
            ) : (
              <Text style={[styles.modalText, styles.boldText, { color: colorScheme === 'dark' ? '#ccc' : '#555' }]}>El código QR no contiene una cita válida o no está registrada en el sistema.</Text>
            )}
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colorScheme === 'dark' ? '#ff5722' : '#007BFF' }]}
              onPress={() => {
                setModalVisible(false);
                setScanned(false);
              }}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
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
    position: 'absolute',
    top: '30%',
    left: '10%',
    right: '10%',
    height: '40%',
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 5,
  },
  qrFrameText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: "transparent",
    flexDirection: "row",
    margin: 20,
  },
  button: {
    flex: 1,
    alignSelf: "flex-end",
    alignItems: "center",
  },
  text: {
    fontSize: 18,
    color: "white",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    padding: 20,
    borderRadius: 10,
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
  closeButton: {
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
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