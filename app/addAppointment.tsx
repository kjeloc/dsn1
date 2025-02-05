import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { db } from "../config/firebaseConfig";
import { collection, addDoc, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { DatePicker } from "antd"; // Import DatePicker from Ant Design for web support

interface AppointmentData {
  patientEmail: string;
  date: string;
  hour: string;
  reason: string;
  dentalOffice: string;
  dentistEmail: string;
}

const AddAppointment: React.FC = () => {
  const { userId } = useLocalSearchParams();
  const router = useRouter();
  const { control, handleSubmit, reset } = useForm<AppointmentData>();

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hour, setHour] = useState("9:00 AM");
  const [dentalOffices, setDentalOffices] = useState<string[]>([]);
  const [patients, setPatients] = useState<string[]>([]);
  const [dentistEmail, setDentistEmail] = useState<string>("");
  const officeHours = [
    "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
  ];

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

  const onSubmit = async (data: AppointmentData) => {
    if (!userId) {
      Alert.alert("Error", "Usuario no identificado.");
      return;
    }

    try {
      // 1. Buscar el ID del paciente basado en su correo electrónico
      const patientsQuery = await getDocs(
        query(collection(db, "userTest"), where("email", "==", data.patientEmail))
      );

      if (patientsQuery.empty) {
        Alert.alert("Error", "No se encontró al paciente con el correo proporcionado.");
        return;
      }

      const patientDoc = patientsQuery.docs[0];
      const patientId = patientDoc.id;

      // 2. Guardar la cita en la subcolección del dentista
      await addDoc(collection(db, "userTest", userId as string, "appointments"), {
        patientEmail: data.patientEmail,
        date: date.toISOString().split("T")[0],
        hour: hour,
        reason: data.reason,
        dentalOffice: data.dentalOffice,
        dentistEmail: dentistEmail,
      });

      // 3. Guardar la cita en la subcolección del paciente
      await addDoc(collection(db, "userTest", patientId, "appointments"), {
        patientEmail: data.patientEmail,
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
    <View style={styles.container}>
      <Text style={styles.title}>Agregar Nueva Cita</Text>

      <Controller
        control={control}
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <Picker
            selectedValue={value}
            onValueChange={onChange}
            style={styles.input}
          >
            <Picker.Item label="Selecciona un paciente" value="" />
            {patients.map((email) => (
              <Picker.Item key={email} label={email} value={email} />
            ))}
          </Picker>
        )}
        name="patientEmail"
        defaultValue=""
      />

      {Platform.OS === "web" ? (
        <DatePicker
          style={{ width: "100%", marginBottom: 15 }}
          onChange={(dateMoment) => setDate(dateMoment?.toDate() || new Date())}
        />
      ) : (
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
          <Text>{date.toISOString().split("T")[0]}</Text>
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

      <Picker
        selectedValue={hour}
        onValueChange={(itemValue) => setHour(itemValue)}
        style={styles.input}
      >
        {officeHours.map((hourOption) => (
          <Picker.Item key={hourOption} label={hourOption} value={hourOption} />
        ))}
      </Picker>

      <Controller
        control={control}
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <Picker
            selectedValue={value}
            onValueChange={onChange}
            style={styles.input}
          >
            <Picker.Item label="Selecciona un consultorio" value="" />
            {dentalOffices.map((office) => (
              <Picker.Item key={office} label={office} value={office} />
            ))}
          </Picker>
        )}
        name="dentalOffice"
        defaultValue=""
      />

      <Controller
        control={control}
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Motivo de la cita"
            onChangeText={onChange}
            value={value}
          />
        )}
        name="reason"
        defaultValue=""
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)}>
        <Text style={styles.buttonText}>Agregar Cita</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F9F9F9",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#FFF",
  },
  button: {
    backgroundColor: "#007BFF",
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