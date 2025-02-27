import React, { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, useColorScheme } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { db } from "../../../config/firebaseConfig";
import { collection, addDoc, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import RNPickerSelect from "react-native-picker-select"; // Importamos react-native-picker-select
import { DatePicker } from "antd"; // Import DatePicker from Ant Design for web support
import { Appointment } from "../../utils/types";

const AddAppointment: React.FC = () => {
  const { userId } = useLocalSearchParams();
  const router = useRouter();
  const { control, handleSubmit, reset } = useForm<Appointment>();
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hour, setHour] = useState("9:00 AM");
  const [dentalOffices, setDentalOffices] = useState<string[]>([]);
  const [patients, setPatients] = useState<string[]>([]);
  const [dentistEmail, setDentistEmail] = useState<string>("");
  const officeHours = [
    "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
  ];
  const colorScheme = useColorScheme(); // Detectar el esquema de color del dispositivo

  // Función para registrar logs
  const logAction = async (userId: string, action: string) => {
    try {
      await addDoc(collection(db, "logs"), {
        userId: userId,
        action: action,
        timestamp: new Date(), // Fecha y hora actual
      });
      console.log("Log registrado correctamente:", action);
    } catch (error) {
      console.error("Error al registrar el log:", error);
    }
  };


  useEffect(() => {
    const fetchDentistData = async () => {
      if (!userId) return;
      try {
        const userDoc = await getDoc(doc(db, "userTest", userId as string));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setDentalOffices(data?.dental_office || []);
          setPatients(data?.patients || []);
          setDentistEmail(data?.email || "");
        }
      } catch (error) {
        console.error("Error al obtener datos del dentista:", error);
      }
    };
    fetchDentistData();
  }, [userId]);

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === "ios");
    setDate(currentDate);
  };

  const onSubmit = async (data: Appointment) => {
    if (!userId) {
      Alert.alert("Error", "Usuario no identificado.");
      return;
    }
    try {
      // Buscar el ID del paciente basado en su correo electrónico
      const patientsQuery = await getDocs(
        query(collection(db, "userTest"), where("email", "==", data.patientEmail))
      );
      if (patientsQuery.empty) {
        Alert.alert("Error", "No se encontró al paciente con el correo proporcionado.");
        return;
      }
      const patientDoc = patientsQuery.docs[0];
      const patientId = patientDoc.id;

      // Guardar la cita en la subcolección del dentista
      await addDoc(collection(db, "userTest", userId as string, "appointments"), {
        patientEmail: data.patientEmail,
        date: date.toISOString().split("T")[0],
        hour: hour,
        reason: data.reason,
        dentalOffice: data.dentalOffice,
        dentistEmail: dentistEmail,
      });

      // Guardar la cita en la subcolección del paciente
      await addDoc(collection(db, "userTest", patientId, "appointments"), {
        patientEmail: data.patientEmail,
        date: date.toISOString().split("T")[0],
        hour: hour,
        reason: data.reason,
        dentalOffice: data.dentalOffice,
        dentistEmail: dentistEmail,
      });
      await logAction(userId as string, "Creación de cita");
      reset();
      Alert.alert("Cita agregada", "La cita se ha guardado correctamente.");
      router.back();
    } catch (error) {
      console.error("Error al agregar la cita:", error);
      Alert.alert("Error", "No se pudo guardar la cita. Inténtalo de nuevo.");
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#121212' : '#F9F9F9' }]}>
      <Text style={[styles.title, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>Agregar Nueva Cita</Text>

      {/* Selector de pacientes */}
      <Controller
        control={control}
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <RNPickerSelect
            onValueChange={onChange}
            items={patients.map((email) => ({ label: email, value: email }))}
            placeholder={{ label: "Selecciona un paciente", value: null }}
            style={{
              inputAndroid: {
                backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#FFF',
                borderColor: colorScheme === 'dark' ? '#444' : '#CCC',
                color: colorScheme === 'dark' ? '#fff' : '#000',
                padding: 10,
                borderRadius: 8,
                marginBottom: 15,
              },
              inputIOS: {
                backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#FFF',
                borderColor: colorScheme === 'dark' ? '#444' : '#CCC',
                color: colorScheme === 'dark' ? '#fff' : '#000',
                padding: 10,
                borderRadius: 8,
                marginBottom: 15,
              },
            }}
          />
        )}
        name="patientEmail"
        defaultValue=""
      />

      {/* Selector de fecha */}
      {Platform.OS === "web" ? (
        <DatePicker
          style={{ width: "100%", marginBottom: 15 }}
          onChange={(dateMoment) => setDate(dateMoment?.toDate() || new Date())}
        />
      ) : (
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#FFF', borderColor: colorScheme === 'dark' ? '#444' : '#CCC' }]}>
          <Text style={{ color: colorScheme === 'dark' ? '#fff' : '#000' }}>{date.toISOString().split("T")[0]}</Text>
        </TouchableOpacity>
      )}
      {showDatePicker && Platform.OS !== "web" && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {/* Selector de hora */}
      <RNPickerSelect
        onValueChange={(itemValue) => setHour(itemValue)}
        items={officeHours.map((hourOption) => ({ label: hourOption, value: hourOption }))}
        placeholder={{ label: "Selecciona una hora", value: null }}
        style={{
          inputAndroid: {
            backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#FFF',
            borderColor: colorScheme === 'dark' ? '#444' : '#CCC',
            color: colorScheme === 'dark' ? '#fff' : '#000',
            padding: 10,
            borderRadius: 8,
            marginBottom: 15,
          },
          inputIOS: {
            backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#FFF',
            borderColor: colorScheme === 'dark' ? '#444' : '#CCC',
            color: colorScheme === 'dark' ? '#fff' : '#000',
            padding: 10,
            borderRadius: 8,
            marginBottom: 15,
          },
        }}
      />

      {/* Selector de consultorios */}
      <Controller
        control={control}
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <RNPickerSelect
            onValueChange={onChange}
            items={dentalOffices.map((office) => ({ label: office, value: office }))}
            placeholder={{ label: "Selecciona un consultorio", value: null }}
            style={{
              inputAndroid: {
                backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#FFF',
                borderColor: colorScheme === 'dark' ? '#444' : '#CCC',
                color: colorScheme === 'dark' ? '#fff' : '#000',
                padding: 10,
                borderRadius: 8,
                marginBottom: 15,
              },
              inputIOS: {
                backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#FFF',
                borderColor: colorScheme === 'dark' ? '#444' : '#CCC',
                color: colorScheme === 'dark' ? '#fff' : '#000',
                padding: 10,
                borderRadius: 8,
                marginBottom: 15,
              },
            }}
          />
        )}
        name="dentalOffice"
        defaultValue=""
      />

      {/* Campo de motivo */}
      <Controller
        control={control}
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#FFF', borderColor: colorScheme === 'dark' ? '#444' : '#CCC', color: colorScheme === 'dark' ? '#fff' : '#000' }]}
            placeholder="Motivo de la cita"
            placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#888'}
            onChangeText={onChange}
            value={value}
          />
        )}
        name="reason"
        defaultValue=""
      />

      {/* Botón de envío */}
      <TouchableOpacity style={[styles.button, { backgroundColor: colorScheme === 'dark' ? '#761FE0' : '#007BFF' }]} onPress={handleSubmit(onSubmit)}>
        <Text style={styles.buttonText}>Agregar Cita</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AddAppointment;