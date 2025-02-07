// app/_layout.tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
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
    </Stack>
  );
}