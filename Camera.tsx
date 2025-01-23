import React from 'react';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useEffect } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Modal } from 'react-native';

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [appointmentData, setAppointmentData] = useState<any>(null);

  useEffect(() => {
    if (!permission?.granted) return;
  }, [permission]);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Se necesita otorgar permisos de la cámara a la aplicación</Text>
        <Button onPress={requestPermission} title="Conceder Permiso" />
      </View>
    );
  }

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    // Validar los datos escaneados
    try {
      const parsedData = JSON.parse(data);
      if (parsedData && parsedData.day && parsedData.date && parsedData.patientName && parsedData.dentistName && parsedData.consultingRoom) {
        // Datos válidos
        setAppointmentData(parsedData);
        setScanned(true);
        setModalVisible(true);
      } else {
        // Si los datos no son válidos
        throw new Error('Datos del QR no válidos');
      }
    } catch (error) {
      setScanned(true);
      setAppointmentData(null);
      setModalVisible(true);
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
            {appointmentData ? (
              <>
                <Text style={[styles.modalText, styles.boldText]}>La cita se ha validado con éxito. Aquí están los detalles:</Text>
                <Text style={styles.modalDetail}><Text style={styles.boldText}>Fecha:</Text> {appointmentData.date}</Text>
                <Text style={styles.modalDetail}><Text style={styles.boldText}>Día:</Text> {appointmentData.day}</Text>
                <Text style={styles.modalDetail}><Text style={styles.boldText}>Paciente:</Text> {appointmentData.patientName}</Text>
                <Text style={styles.modalDetail}><Text style={styles.boldText}>Odontólogo:</Text> {appointmentData.dentistName}</Text>
                <Text style={styles.modalDetail}><Text style={styles.boldText}>Consultorio:</Text> {appointmentData.consultingRoom}</Text>
              </>
            ) : (
              <Text style={[styles.modalText, styles.boldText]}>El código QR no contiene una cita válida.</Text>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C6E49',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  modalDetail: {
    fontSize: 16,
    marginBottom: 10,
    color: '#555',
  },
  boldText: {
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#FF6347',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
  },
});
