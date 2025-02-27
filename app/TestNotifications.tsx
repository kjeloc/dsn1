// app/TestNotifications.tsx
import React, { useState } from 'react';
import { View, Text, Button, TextInput, StyleSheet } from 'react-native';
import { scheduleLocalNotification } from './utils/NotificationService';

const TestNotifications = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const handleScheduleNotification = () => {
    if (!title || !body) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    scheduleLocalNotification(title, body, new Date(Date.now() + 5000)); // 5 segundos después
    alert('Notificación programada');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Título:</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Escribe el título"
      />
      <Text style={styles.label}>Mensaje:</Text>
      <TextInput
        style={styles.input}
        value={body}
        onChangeText={setBody}
        placeholder="Escribe el mensaje"
      />
      <Button title="Programar Notificación" onPress={handleScheduleNotification} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
});

export default TestNotifications;