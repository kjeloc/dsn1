import React, { useState } from 'react';
import {View,Text,TextInput,TouchableOpacity,StyleSheet,Alert,FlatList,} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { db } from '../config/firebaseConfig';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

interface FormData {
  email: string;
  name: string;
  password: string;
  birthdate: string; // Formato YYYY-MM-DD
  patients: string[]; // Array de correos de pacientes
  dental_office: string[]; // Array de nombres de consultorios
}

const RegisterDentist: React.FC = () => {
  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>();
  const [date, setDate] = useState(new Date()); // Fecha seleccionada
  const [showDatePicker, setShowDatePicker] = useState(false); // Controla la visibilidad del selector
  const [patients, setPatients] = useState<string[]>(['aun no hay pacientes']); // Lista de pacientes
  const [dentalOffices, setDentalOffices] = useState<string[]>(['Consultorio 0']); // Lista de consultorios

  // Manejador de cambio de fecha
  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    setDate(currentDate);
  };

  // Agregar un paciente
  const handleAddPatient = async (patientEmail: string) => {
    if (!patientEmail.trim()) {
      Alert.alert('Error', 'El correo del paciente no puede estar vacío.');
      return;
    }

    try {
      // Buscar el paciente en Firestore
      const q = query(collection(db, 'userTest'), where('email', '==', patientEmail), where('rol', '==', 'Patient'));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert('Error', 'No existe este paciente o no es un paciente.');
        return;
      }

      // Verificar si el paciente ya está registrado
      if (patients.includes(patientEmail)) {
        Alert.alert('Error', 'Ya registraste a este paciente.');
        return;
      }

      // Agregar el paciente
      setPatients((prevPatients) => [...prevPatients.filter((p) => p !== 'aun no hay pacientes'), patientEmail]);
      Alert.alert('Éxito', 'Se agregó con éxito.');
    } catch (error) {
      console.error('Error al buscar el paciente:', error);
      Alert.alert('Error', 'Ocurrió un error al buscar el paciente.');
    }
  };

  // Agregar un consultorio
  const handleAddDentalOffice = (officeName: string) => {
    if (!officeName.trim()) {
      Alert.alert('Error', 'El nombre del consultorio no puede estar vacío.');
      return;
    }

    if (dentalOffices.includes(officeName)) {
      Alert.alert('Error', 'Este consultorio ya está registrado.');
      return;
    }

    setDentalOffices((prevOffices) => [...prevOffices, officeName]);
    Alert.alert('Éxito', 'Consultorio agregado con éxito.');
  };

  // Función de envío
  const onSubmit = async (data: FormData) => {
    try {
      await addDoc(collection(db, 'userTest'), {
        email: data.email,
        name: data.name,
        password: data.password,
        rol: 'Dentist',
        birthdate: data.birthdate,
        patients: patients,
        dental_office: dentalOffices,
        state: 'Inactivo',
      });

      reset();
      setPatients(['aun no hay pacientes']);
      setDentalOffices(['Consultorio 0']);
      Alert.alert('Registro exitoso', 'Tu cuenta de dentista ha sido creada correctamente.');
    } catch (error) {
      console.error('Error al guardar el registro:', error);
      Alert.alert('Error', 'No se pudo guardar el registro. Inténtalo de nuevo.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro de Dentista</Text>

      {/* Navegación entre secciones */}
      <FlatList
        data={['Datos Personales', 'Pacientes', 'Consultorios']}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{item}</Text>
            {item === 'Datos Personales' && (
              <>
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
                  name="name"
                  defaultValue=""
                />
                {errors.name && <Text style={styles.errorText}>Este campo es requerido.</Text>}

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
                  name="email"
                  defaultValue=""
                />
                {errors.email && <Text style={styles.errorText}>Correo electrónico inválido.</Text>}

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
                  name="password"
                  defaultValue=""
                />
                {errors.password && <Text style={styles.errorText}>La contraseña debe tener al menos 6 caracteres.</Text>}

                {/* Selector de Fecha de Nacimiento */}
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
                  <Text>{dayjs(date).format('YYYY-MM-DD') || 'Selecciona tu fecha de nacimiento'}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        const formattedDate = dayjs(selectedDate).format('YYYY-MM-DD');
                        control._formValues.birthdate = formattedDate; // Actualiza el valor del formulario
                        setDate(selectedDate);
                        setShowDatePicker(false);
                      }
                    }}
                  />
                )}
              </>
            )}

            {item === 'Pacientes' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Ingresa el correo del paciente"
                  onSubmitEditing={({ nativeEvent }) => handleAddPatient(nativeEvent.text)}
                />
                <FlatList
                  data={patients}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => <Text style={styles.listItem}>{item}</Text>}
                />
              </>
            )}

            {item === 'Consultorios' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Ingresa el nombre del consultorio"
                  onSubmitEditing={({ nativeEvent }) => handleAddDentalOffice(nativeEvent.text)}
                />
                <FlatList
                  data={dentalOffices}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => <Text style={styles.listItem}>{item}</Text>}
                />
              </>
            )}
          </View>
        )}
      />

      {/* Botón de Envío */}
      <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)}>
        <Text style={styles.buttonText}>Registrar Dentista</Text>
      </TouchableOpacity>
    </View>
  );
};

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
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
  listItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});

export default RegisterDentist;