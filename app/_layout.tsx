import { Stack } from "expo-router";
import { ThemeProvider } from "./ThemeContext";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import * as Notifications from 'expo-notifications';
import { requestNotificationPermissions } from './utils/NotificationService';
import { useEffect } from "react";


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export default function RootLayout() {
  const colorScheme = useColorScheme(); 
  useEffect(() => {
    // Solicitar permisos al iniciar la aplicación
    requestNotificationPermissions();
  }, []);
  return (
    <ThemeProvider>
      <StatusBar
        style={colorScheme === "dark" ? "light" : "dark"} // Texto claro en modo oscuro, texto oscuro en modo claro
        backgroundColor={colorScheme === "dark" ? "#121212" : "#ffffff"} // Fondo adaptado al modo
      />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ title: "Login" }} />
        <Stack.Screen name="menuAdmin" options={{ title: "Admin" }} />
        <Stack.Screen name="menuDentist" options={{ title: "Dentista" }} />
        <Stack.Screen name="menuPatient" options={{ title: "Paciente" }} />
        <Stack.Screen name="addAppointment" options={{ title: "AgregarCita" }} />
        <Stack.Screen name="ViewAppointmentDentist" options={{ title: "Detalles de la Cita" }} />
        <Stack.Screen name="ViewAppointmentPatient" options={{ title: "Detalles de la Cita" }} />
        <Stack.Screen name="QRScannerScreen" options={{ title: "Qr Scan" }} />
        <Stack.Screen name="registerUser" options={{ title: "Registro de Usuario" }} />
        <Stack.Screen name="registerDentist" options={{ title: "Registro de Dentista" }} />
        <Stack.Screen name="ProfileDentist" options={{ title: "Perfil del Dentista" }} />
        <Stack.Screen name="ProfilePatient" options={{ title: "Perfil del Paciente" }} />
        <Stack.Screen name="ChatListScreen" options={{ title: "Lista de Chats" }} />
        <Stack.Screen name="ChatScreen" options={{ title: "Chats" }} />
        <Stack.Screen name="DentisListScreen" options={{ title: "Odontólogos Asociados" }} />
        <Stack.Screen name="MapScreen" options={{ title: "Mapa" }} />
        <Stack.Screen name="CreateForum" options={{ title: "Crear Foro" }} />
        <Stack.Screen name="lista-foros" options={{ title: "Lista de Foros" }} />
        <Stack.Screen name="ver-foro/[id]" options={{ title: "Ver Foro" }} />
        <Stack.Screen name="CreateWorkgroups" options={{ title: 'Crear Grupo de Trabajo' }} />
        <Stack.Screen name="ViewWorkgroupsScreen" options={{ title: 'Ver Grupo de Trabajo' }} />
        <Stack.Screen name="ViewWorkgroupDetails" options={{ title: 'Detalles Grupo de Trabajo' }} />
        <Stack.Screen name="GroupChatScreen" options={{ title: 'Chat Grupo de Trabajo' }} />
        <Stack.Screen name="RequestAppointment" options={{ title: 'Solicitar Cita' }} />
        <Stack.Screen name="TestNotifications" options={{ title: 'Probar Notificaciones' }} />
      </Stack>
    </ThemeProvider>
  );
}