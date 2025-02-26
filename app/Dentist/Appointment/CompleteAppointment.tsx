import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  useColorScheme,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { db } from "../../../config/firebaseConfig";
import { collection, addDoc, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import RNPickerSelect from "react-native-picker-select";
import { Appointment } from "../../utils/types";

const CompleteAppointment: React.FC = () => {
  const { userId, patientEmail } = useLocalSearchParams();
  const router = useRouter();
  const { control, handleSubmit, reset } = useForm<Appointment>();
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hour, setHour] = useState("9:00 AM");
  const [dentalOffices, setDentalOffices] = useState([]);
  const [dentistEmail, setDentistEmail] = useState("");
  const officeHours = [
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
  ];
  const colorScheme = useColorScheme();

  useEffect(() => {
    const fetchDentistData = async () => {
      if (!userId) return;
      try {
        const userDoc = await getDoc(doc(db, "userTest", userId as string));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setDentalOffices(data?.dental_office || []);
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
          query(collection(db, "userTest"), where("email", "==", patientEmail))
        );
        if (patientsQuery.empty) {
          Alert.alert("Error", "No se encontró al paciente con el correo proporcionado.");
          return;
        }
        const patientDoc = patientsQuery.docs[0];
        const patientId = patientDoc.id;
  
        // Guardar la cita en la subcolección del dentista
        await addDoc(collection(db, "userTest", userId as string, "appointments"), {
          patientEmail: patientEmail,
          date: date.toISOString().split("T")[0],
          hour: hour,
          reason: data.reason,
          dentalOffice: data.dentalOffice,
          dentistEmail: dentistEmail,
        });
  
        // Guardar la cita en la subcolección del paciente
        await addDoc(collection(db, "userTest", patientId, "appointments"), {
          patientEmail: patientEmail,
          date: date.toISOString().split("T")[0],
          hour: hour,
          reason: data.reason,
          dentalOffice: data.dentalOffice,
          dentistEmail: dentistEmail,
        });
  
        reset();
        Alert.alert("Cita agregada", "La cita se ha guardado correctamente.");
        router.back();
      } catch (error) {
        console.error("Error al agregar la cita:", error);
        Alert.alert("Error", "No se pudo guardar la cita. Inténtalo de nuevo.");
      }
    };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Completar Cita</Text>

      {/* Campo de paciente (prellenado) */}
      <Text style={styles.label}>Paciente:</Text>
      <Text style={styles.value}>{patientEmail}</Text>

      {/* Selector de fecha */}
      {Platform.OS === "web" ? (
        <DateTimePicker
          value={date}
          onChange={(e, selectedDate) => setDate(selectedDate || new Date())}
        />
      ) : (
        <>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
            <Text>{date.toISOString().split("T")[0]}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}
        </>
      )}

      {/* Selector de hora */}
      <RNPickerSelect
        onValueChange={(value) => setHour(value)}
        items={officeHours.map((hourOption) => ({ label: hourOption, value: hourOption }))}
        placeholder={{ label: "Selecciona una hora", value: null }}
        style={{
          inputAndroid: {
            backgroundColor: colorScheme === "dark" ? "#1e1e1e" : "#FFF",
            borderColor: colorScheme === "dark" ? "#444" : "#CCC",
            color: colorScheme === "dark" ? "#fff" : "#000",
            padding: 10,
            borderRadius: 8,
            marginBottom: 15,
          },
          inputIOS: {
            backgroundColor: colorScheme === "dark" ? "#1e1e1e" : "#FFF",
            borderColor: colorScheme === "dark" ? "#444" : "#CCC",
            color: colorScheme === "dark" ? "#fff" : "#000",
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
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[styles.input, { backgroundColor: colorScheme === "dark" ? "#1e1e1e" : "#FFF" }]}
            placeholder="Motivo de la cita"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
        name="reason"
        defaultValue=""
      />

      {/* Botón de envío */}
      <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)}>
        <Text style={styles.buttonText}>Completar Cita</Text>
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
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    marginBottom: 15,
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
    backgroundColor: "#007BFF",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CompleteAppointment;