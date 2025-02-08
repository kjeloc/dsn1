// app/LoginScreen.tsx
import { useState, useEffect, useRef } from 'react';
import {  View,  TextInput,  Button,  StyleSheet,  Text,  Alert, Platform} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import {  collection,  getDocs,  query,  where,  doc,  updateDoc} from "firebase/firestore";
import { auth, db } from "../config/firebaseConfig";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Location from "expo-location"; // Importar expo-location
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import dayjs from "dayjs";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { userId } = useLocalSearchParams();

  // Función para obtener la ubicación actual del usuario
  const getUserLocation = async (userId: string) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Permiso de ubicación denegado");
        return null;
      }
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      // Actualizar el documento del usuario en Firestore con la ubicación
      await updateDoc(doc(db, "userTest", userId), {
        AcPos: { latitude, longitude }, // Guardar como un objeto con latitud y longitud
      });
      console.log("Ubicación registrada:", { latitude, longitude });
    } catch (error) {
      console.error("Error al obtener la ubicación:", error);
    }
  };

  // Función para programar una notificación local
  const scheduleNotification = async (appointmentCount: number) => {
    const notificationContent = {
      title: "Recordatorio de citas",
      body: `Hoy tienes ${appointmentCount} cita(s) programada(s).`,
    };
  
    await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: null,
    });
  };

  // Función para contar las citas del día actual
  const countAppointmentsForToday = async (userId: string) => {
    try {
      const today = dayjs().format("YYYY-MM-DD"); // Fecha actual en formato YYYY-MM-DD
      const appointmentsSnapshot = await getDocs(
        collection(db, "userTest", userId, "appointments")
      );

      const todaysAppointments = appointmentsSnapshot.docs.filter((doc) => {
        const appointment = doc.data();
        return appointment.date === today;
      });

      return todaysAppointments.length;
    } catch (error) {
      console.error("Error al contar las citas:", error);
      return 0;
    }
  };

  const handleLogin = async () => {
    try {
      // Buscar el usuario en la colección "userTest"
      const usersRef = collection(db, "userTest");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        Alert.alert("Error", "Usuario no encontrado");
        return;
      }
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      if (userData.password !== password) {
        Alert.alert("Error", "Contraseña incorrecta");
        return;
      }

      // Obtener la ubicación del usuario y actualizar el documento
      await getUserLocation(userDoc.id);

      // Contar las citas del día actual
      console.log("Es culpa del Login Screen");
      const appointmentCount = await countAppointmentsForToday(userDoc.id);

      // Programar la notificación
      await scheduleNotification(appointmentCount);

      // Redirigir según el rol del usuario
      if (userData.rol === "Admin") {
        router.push("/menuAdmin");
      } else if (userData.rol === "Dentist") {
        router.push(`/menuDentist?userId=${userDoc.id}`);
      } else if (userData.rol === "Patient") {
        router.push(`/menuPatient?userId=${userDoc.id}`);
      } else {
        Alert.alert("Error", "Rol no válido");
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      Alert.alert("Error", "Ocurrió un error al iniciar sesión");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Iniciar Sesión" onPress={handleLogin} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#181818",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    color: "#fff",
    fontWeight: "600",
  },
  input: {
    height: 50,
    borderColor: "#333",
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: "#2c2f33",
    color: "#fff",
    fontSize: 16,
  },
});

export default LoginScreen;