import React from 'react';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useEffect } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Modal } from 'react-native';
import dayjs from 'dayjs'; // Importar dayjs para manejar fechas

interface Appointment {
    id: string;
    patientEmail: string;
    date: string;
    hour: string;
    reason: string;
    dentalOffice: string;
    dentistEmail: string;
  }
  
interface QRScannerScreenProps {
  userId: string; // userId pasado como prop
  appointments: Appointment[]; // Citas pasadas como prop
}

const QRScannerScreen: React.FC<QRScannerScreenProps> = ({ userId, appointments }) => {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

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
        // Validar si la cita existe en el sistema
        const isAppointmentValid = validateAppointment(parsedData);
        if (isAppointmentValid) {
          setAppointmentData(parsedData);
          checkAppointmentDate(parsedData); // Verificar la fecha de la cita
        } else {
          setAppointmentData(null);
          setValidationMessage("La cita no está registrada en el sistema.");
        }
        setScanned(true);
        setModalVisible(true);
      } else {
        throw new Error('Datos del QR no válidos');
      }
    } catch (error) {
      setScanned(true);
      setAppointmentData(null);
      setValidationMessage("El código QR no contiene una cita válida.");
      setModalVisible(true);
    }
  };

  const validateAppointment = (scannedAppointment: Appointment) => {
    return appointments.some((appointment) => {
      return (
        appointment.patientEmail === scannedAppointment.patientEmail &&
        appointment.date === scannedAppointment.date &&
        appointment.hour === scannedAppointment.hour &&
        appointment.reason === scannedAppointment.reason &&
        appointment.dentalOffice === scannedAppointment.dentalOffice &&
        appointment.dentistEmail === scannedAppointment.dentistEmail
      );
    });
  };

  const checkAppointmentDate = (scannedAppointment: Appointment) => {
    const today = dayjs(); // Fecha actual
    const appointmentDate = dayjs(scannedAppointment.date); // Fecha de la cita

    if (appointmentDate.isSame(today, 'day')) {
      setValidationMessage("La cita ha sido confirmada.");
    } else if (appointmentDate.isBefore(today, 'day')) {
      setValidationMessage("La cita ha expirado.");
    } else {
      setValidationMessage("Esta cita es el día ${scannedAppointment.date} a las ${scannedAppointment.hour}");
    }
  };

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>¡Cita Escaneada!</Text>
            {validationMessage && (
              <Text style={[styles.modalText, styles.boldText]}>{validationMessage}</Text>
            )}
            {appointmentData ? (
              <>
                <Text style={[styles.modalText, styles.boldText]}>Detalles de la cita:</Text>
                <Text style={styles.modalDetail}><Text style={styles.boldText}>ID:</Text> {appointmentData.id}</Text>
                <Text style={styles.modalDetail}><Text style={styles.boldText}>Odontólogo:</Text> {appointmentData.dentistEmail}</Text>
                <Text style={styles.modalDetail}><Text style={styles.boldText}>Fecha:</Text> {appointmentData.date}</Text>
                <Text style={styles.modalDetail}><Text style={styles.boldText}>Paciente:</Text> {appointmentData.patientEmail}</Text>
                <Text style={styles.modalDetail}><Text style={styles.boldText}>Hora:</Text> {appointmentData.hour}</Text>
                <Text style={styles.modalDetail}><Text style={styles.boldText}>Consultorio:</Text> {appointmentData.dentalOffice}</Text>
                <Text style={styles.modalDetail}><Text style={styles.boldText}>Motivo:</Text> {appointmentData.reason}</Text>
              </>
            ) : (
              <Text style={[styles.modalText, styles.boldText]}>No se encontraron detalles válidos.</Text>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setModalVisible(false);
                setScanned(false); // Permitir escanear de nuevo
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
    modalDetail: {
        fontSize: 16,
        marginBottom: 10,
        color: "#555",
    },
    boldText: {
        fontWeight: "bold",
    },
    message: {
        textAlign: "center",
        paddingBottom: 10,
    },
    camera: {
        flex: 1,
        width: "100%",
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
        backgroundColor: "rgba(0, 0, 0, 0.7)",
    },
    modalContent: {
        width: "80%",
        backgroundColor: "white",
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
    closeButton: {
        backgroundColor: "#007BFF",
        padding: 10,
        borderRadius: 5,
    },
    closeButtonText: {
        color: "white",
        fontSize: 16,
    },
    permissionButton: {
        backgroundColor: "#007BFF",
        padding: 10,
        borderRadius: 5,
    },
    permissionText: {
        color: "white",
        fontSize: 16,
    },
});

export default QRScannerScreen;