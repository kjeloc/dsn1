// screens/LoginScreen.tsx
import { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Text,
  Alert,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Para íconos
import { collection, getDocs, query, where, doc, updateDoc, addDoc } from "firebase/firestore";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import dayjs from "dayjs";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAppTheme } from "../Constants/Colors"; // Importar los colores dinámicos
import { db } from "../../config/firebaseConfig";
import SkeletonLoader from "../Components/SkeletonLoader";

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
  const [isLoading, setIsLoading] = useState(false); // Estado para bloquear los campos
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const theme = useAppTheme(); // Obtener el tema dinámico

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
    const requestNotificationPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.warn("Permiso de notificaciones denegado");
        Alert.alert(
          "Notificaciones Desactivadas",
          "No podrás recibir recordatorios de citas si no otorgas permisos."
        );
      }
    };
    requestNotificationPermissions();
  }, []);

  const getUserLocation = async (userId: string) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Permiso de ubicación denegado");
        return null;
      }
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      await updateDoc(doc(db, "userTest", userId), {
        AcPos: { latitude, longitude },
      });
      console.log("Ubicación registrada:", { latitude, longitude });
    } catch (error) {
      console.error("Error al obtener la ubicación:", error);
    }
  };

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

  const countAppointmentsForToday = async (userId: string) => {
    try {
      const today = dayjs().format("YYYY-MM-DD");
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
    if (!email || !password) {
      Alert.alert("Error", "Por favor, completa todos los campos.");
      return;
    }

    setIsLoading(true); // Bloquear los campos

    try {
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

      // Registrar log de inicio de sesión
      await logAction(userDoc.id, "Inicio de sesión");

      await getUserLocation(userDoc.id);
      const appointmentCount = await countAppointmentsForToday(userDoc.id);
      await scheduleNotification(appointmentCount);

      if (userData.rol === "Admin") {
        router.replace("/Admin/menuAdmin");
      } else if (userData.rol === "Dentist") {
        router.replace(`/Dentist/menuDentist?userId=${userDoc.id}`);
      } else if (userData.rol === "Patient") {
        router.replace(`/Patient/menuPatient?userId=${userDoc.id}`);
      } else {
        Alert.alert("Error", "Rol no válido");
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      Alert.alert("Error", "Ocurrió un error al iniciar sesión");
    } finally {
      setIsLoading(false); // Desbloquear los campos
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Título */}
      {isLoading ? (
        <SkeletonLoader width={250} height={40} borderRadius={8} />
      ) : (
        <Text style={[styles.title, { color: theme.text }]}>DENTAL SOCIAL NETWORK</Text>
      )}
      {/* Logo */}
      {isLoading ? (
        <SkeletonLoader width={80} height={80} borderRadius={40} />
      ) : (
        <Image source={require("../../assets/images/salud-dental.png")} style={[styles.logo, { width: 80, height: 80 }]} />
      )}
      {/* Campo de Correo Electrónico */}
      {isLoading ? (
        <SkeletonLoader width={100} height={50} borderRadius={8} />
      ) : (
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.card, borderColor: theme.border, color: theme.text },
          ]}
          placeholder="Correo electrónico"
          placeholderTextColor={theme.secondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isLoading} // Deshabilitar cuando isLoading es true
        />
      )}
      {/* Campo de Contraseña */}
      {isLoading ? (
        <SkeletonLoader width={100} height={50} borderRadius={8} />
      ) : (
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.card, borderColor: theme.border, color: theme.text },
          ]}
          placeholder="Contraseña"
          placeholderTextColor={theme.secondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading} // Deshabilitar cuando isLoading es true
        />
      )}
      {/* Botón de Iniciar Sesión */}
      {isLoading ? (
        <SkeletonLoader width={100} height={50} borderRadius={8} />
      ) : (
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.button, opacity: isLoading ? 0.5 : 1 },
          ]}
          onPress={handleLogin}
          disabled={isLoading} // Deshabilitar el botón cuando isLoading es true
        >
          <Text style={styles.buttonText}>{isLoading ? "Iniciando..." : "Iniciar Sesión"}</Text>
        </TouchableOpacity>
      )}
      {/* Botón de Crear Cuenta para Paciente */}
      {isLoading ? (
        <SkeletonLoader width={100} height={50} borderRadius={8} />
      ) : (
        <TouchableOpacity
          style={styles.createAccountButton}
          onPress={() => router.push("/Auth/registerUser")} // Navegar a la pantalla de registro
        >
          <Text style={styles.createAccountButtonText}>Crear Cuenta para Paciente</Text>
        </TouchableOpacity>
      )}
      {/* Botón de Crear Cuenta para Dentista */}
      {isLoading ? (
        <SkeletonLoader width={100} height={50} borderRadius={8} />
      ) : (
        <TouchableOpacity
          style={styles.createAccountButton}
          onPress={() => router.push("/Auth/registerDentist")} // Navegar a la pantalla de registro
        >
          <Text style={styles.createAccountButtonText}>Crear Cuenta para Dentista</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  logo: {
    marginBottom: 40,
  },
  input: {
    height: 50,
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    width: "100%",
    fontSize: 16,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  createAccountButton: {
    marginTop: 20,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    width: "100%",
  },
  createAccountButtonText: {
    color: "#007BFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default LoginScreen;