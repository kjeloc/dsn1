import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { db } from '../config/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

// Interfaz actualizada
interface FormData {
  Pname: string;
  Pemail: string;
  Ppassword: string;
  Pbirthdate: string; // Fecha de nacimiento en formato YYYY-MM-DD
}

const RegisterUser: React.FC = () => {
  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>();
  const [date, setDate] = useState(new Date()); // Fecha seleccionada
  const [showDatePicker, setShowDatePicker] = useState(false); // Controla la visibilidad del selector

  // Manejador de cambio de fecha
  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios'); // En iOS, el selector permanece visible
    setDate(currentDate);
  };

  // Función de envío
  const onSubmit = async (data: FormData) => {
    try {
      await addDoc(collection(db, 'userTest'), {
        name: data.Pname,
        email: data.Pemail,
        password: data.Ppassword,
        birthdate: data.Pbirthdate,
        rol: "Patient",
      });
      reset();
      Alert.alert('Registro exitoso', 'Tu cuenta ha sido creada correctamente.');
    } catch (error) {
      console.error('Error al guardar el registro:', error);
      Alert.alert('Error', 'No se pudo guardar el registro. Inténtalo de nuevo.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crea tu Cuenta</Text>

      {/* Campo de Nombre */}
      <Controller
        control={control}
        rules={{ required: true }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Ingresa tu nombre"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
        name="Pname"
        defaultValue=""
      />
      {errors.Pname && <Text style={styles.errorText}>Este campo es requerido.</Text>}

      {/* Campo de Correo Electrónico */}
      <Controller
        control={control}
        rules={{
          required: true,
          pattern: /^\S+@\S+$/i,
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Ingresa tu correo"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            keyboardType="email-address"
          />
        )}
        name="Pemail"
        defaultValue=""
      />
      {errors.Pemail && <Text style={styles.errorText}>Correo electrónico inválido.</Text>}

      {/* Campo de Contraseña */}
      <Controller
        control={control}
        rules={{
          required: true,
          minLength: 6,
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Crea una contraseña"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            secureTextEntry
          />
        )}
        name="Ppassword"
        defaultValue=""
      />
      {errors.Ppassword && <Text style={styles.errorText}>La contraseña debe tener al menos 6 caracteres.</Text>}

      {/* Selector de Fecha de Nacimiento */}
      <Controller
        control={control}
        rules={{
          required: true,
          validate: (value) => {
            const isValid = dayjs(value, 'YYYY-MM-DD', true).isValid();
            return isValid || 'La fecha debe estar en formato YYYY-MM-DD';
          },
        }}
        render={({ field: { onChange, value } }) => (
          <>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
              <Text>{value || 'Selecciona tu fecha de nacimiento'}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    const formattedDate = dayjs(selectedDate).format('YYYY-MM-DD');
                    onChange(formattedDate); // Actualiza el valor del formulario
                    setDate(selectedDate);
                    setShowDatePicker(false);
                  }
                }}
              />
            )}
          </>
        )}
        name="Pbirthdate"
        defaultValue=""
      />
      {errors.Pbirthdate && <Text style={styles.errorText}>{errors.Pbirthdate.message}</Text>}

      {/* Botón de Envío */}
      <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)}>
        <Text style={styles.buttonText}>Crear Cuenta</Text>
      </TouchableOpacity>
    </View>
  );
};

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});

export default RegisterUser;