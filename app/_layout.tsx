// app/_layout.tsx
import { Stack } from "expo-router";
import { ThemeProvider } from "./ThemeContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
<<<<<<< HEAD
      <Stack>
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
      </Stack>
=======
    <Stack>
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
      <Stack.Screen name="ProfileDentist" options={{ title: "Registro de Dentista" }} />
      <Stack.Screen name="ProfilePatient" options={{ title: "Perfil del Paciente" }} /> 
      <Stack.Screen name="ChatListScreen" options={{title: "Lista de Chats"}} />
      <Stack.Screen name="ChatScreen" options={{title: "Chats"}} />
      <Stack.Screen name="CreateForum" options={{title: "Crear Foro"}} />
      <Stack.Screen name="lista-foros" options={{ title: "Lista de Foros" }} />
      <Stack.Screen name="ver-foro/[id]" options={{ title: "Ver Foro" }} />
      <Stack.Screen name="CreateWorkgroups" options={{ title: 'Crear Grupo de Trabajo' }} />
      <Stack.Screen name="ViewWorkgroupsScreen" options={{ title: 'Ver Grupo de Trabajo' }} />
      <Stack.Screen name="ViewWorkgroupDetails" options={{ title: 'Detalles Grupo de Trabajo' }} />
      <Stack.Screen name="GroupChatScreen" options={{ title: 'Chat Grupo de Trabajo' }} />
    </Stack>
>>>>>>> 43ce83ae90e22031e3abab056668fb81eb560965
    </ThemeProvider>
  );
}