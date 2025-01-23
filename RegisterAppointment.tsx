import React, { useState } from 'react';
import { Button, TextInput, StyleSheet, Text, View, Alert, ScrollView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export default function RegisterAppointment() {
  const [day, setDay] = useState('');
  const [date, setDate] = useState('');
  const [patientName, setPatientName] = useState('');
  const [dentistName, setDentistName] = useState('');
  const [consultingRoom, setConsultingRoom] = useState('');
  const [qrValue, setQrValue] = useState<string | null>(null);

  const handleFormSubmit = () => {
    if (!day || !date || !patientName || !dentistName || !consultingRoom) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    const appointmentData = {
      day,
      date,
      patientName,
      dentistName,
      consultingRoom,
    };

    setQrValue(JSON.stringify(appointmentData));
    Alert.alert('Cita registrada', 'La cita fue registrada correctamente y el QR fue generado');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Registro de Cita Odontológica</Text>

      <TextInput
        style={styles.input}
        placeholder="Día"
        value={day}
        onChangeText={setDay}
      />
      <TextInput
        style={styles.input}
        placeholder="Fecha (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
      />
      <TextInput
        style={styles.input}
        placeholder="Nombre del Paciente"
        value={patientName}
        onChangeText={setPatientName}
      />
      <TextInput
        style={styles.input}
        placeholder="Nombre del Odontólogo"
        value={dentistName}
        onChangeText={setDentistName}
      />
      <TextInput
        style={styles.input}
        placeholder="Consultorio"
        value={consultingRoom}
        onChangeText={setConsultingRoom}
      />

      <Button title="Registrar Cita" onPress={handleFormSubmit} />

      {qrValue && (
        <View style={styles.qrContainer}>
          <Text style={styles.qrText}>Código QR de la Cita</Text>
          <QRCode value={qrValue} size={200} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 12,
    paddingLeft: 8,
    fontSize: 16,
  },
  qrContainer: {
    marginTop: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrText: {
    fontSize: 18,
    marginBottom: 10,
  },
});
