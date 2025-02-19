
import { useState,useEffect} from "react";
import { View, TextInput, Button, StyleSheet, Text, Alert, Platform, TouchableOpacity } from "react-native";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import dayjs from "dayjs";
import { useTheme } from "../ThemeContext"; // Importar el hook para cambiar el tema
import { db } from "../../config/firebaseConfig";
import { useRouter, useLocalSearchParams } from "expo-router";

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
  const { theme, toggleTheme } = useTheme(); // Obtener el tema y la función para alternar

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
      const appointmentsSnapshot = await getDocs(collection(db, "userTest", userId, "appointments"));
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
      await getUserLocation(userDoc.id);
      const appointmentCount = await countAppointmentsForToday(userDoc.id);
      await scheduleNotification(appointmentCount);
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
    } finally {
      setIsLoading(false); // Desbloquear los campos
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Botón de Cambio de Tema */}
      <TouchableOpacity onPress={toggleTheme} style={styles.themeButton}>
        <Text style={styles.themeButtonText}>T</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: theme.colors.text }]}>Iniciar Sesión</Text>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        ]}
        placeholder="Correo electrónico"
        placeholderTextColor={theme.colors.secondary}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!isLoading} // Deshabilitar cuando isLoading es true
      />
      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        ]}
        placeholder="Contraseña"
        placeholderTextColor={theme.colors.secondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isLoading} // Deshabilitar cuando isLoading es true
      />
      <TouchableOpacity
        style={[styles.button, { opacity: isLoading ? 0.5 : 1 }]} // Reducir opacidad cuando isLoading es true
        onPress={handleLogin}
        disabled={isLoading} // Deshabilitar el botón cuando isLoading es true
      >
        <Text style={styles.buttonText}>{isLoading ? "Iniciando..." : "Iniciar Sesión"}</Text>
      </TouchableOpacity>
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
    fontSize: 28,
    marginBottom: 20,
    fontWeight: "600",
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
    backgroundColor: "#007BFF",
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
  themeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    backgroundColor: "#E0E0E0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  themeButtonText: {
    fontSize: 20,
  },
});

export default LoginScreen;