// MenuDentist.tsx
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import dayjs from "dayjs";
import { fetchAppointments, fetchDentistData } from "../utils/firebaseService";
import { Appointment } from "../utils/types";

const MenuDentist: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dentistName, setDentistName] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [mostrarCalendario, setMostrarCalendario] = useState(true);
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const toggleCalendario = () => setMostrarCalendario(!mostrarCalendario);

  // Cargar citas del odontólogo
  const fetchAppointmentsData = useCallback(async () => {
    if (!userId) return;
    try {
      const appointmentList = await fetchAppointments(userId);
      setAppointments(appointmentList);
    } catch (error) {
      console.error("Error al cargar las citas:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Cargar datos del odontólogo
  const fetchDentistInfo = useCallback(async () => {
    if (!userId) return;
    try {
      const dentistData = await fetchDentistData(userId);
      setDentistName(dentistData?.name || "Menú Dentista");
    } catch (error) {
      console.error("Error al cargar los datos del dentista:", error);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchDentistInfo();
      fetchAppointmentsData();
    }, [fetchDentistInfo, fetchAppointmentsData])
  );

  const handleDayPress = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const renderCalendar = () => {
    const today = dayjs();
    const firstDayOfWeek = today.startOf("week");
    const calendarDays = Array.from({ length: 35 }, (_, index) =>
      firstDayOfWeek.add(index, "day")
    );

    return (
      <View style={styles.calendarContainer}>
        {calendarDays.map((date, index) => {
          const formattedDate = date.format("YYYY-MM-DD");
          const isPast = date.isBefore(today, "day");
          const hasAppointments = appointments.some(
            (appointment) => appointment.date === formattedDate
          );
          const isSelected = selectedDays.includes(formattedDate);

          let backgroundColor = "#B0E0E6";
          if (isPast) backgroundColor = "#D3D3D3";
          if (hasAppointments) backgroundColor = "#32CD32";
          if (isSelected) backgroundColor = "#000000";

          return (
            <TouchableOpacity
              key={index}
              style={[styles.calendarButton, { backgroundColor }]}
              onPress={() => handleDayPress(formattedDate)}
            >
              <Text
                style={[
                  styles.calendarText,
                  isSelected && { color: "#FFFFFF" },
                ]}
              >
                {date.format("DD")}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const getUpcomingAppointments = () => {
    const today = dayjs();
    const nextSunday = today.endOf("week").add(7, "day");

    return appointments
      .filter((appointment) => {
        const appointmentDate = dayjs(appointment.date);
        return (
          appointmentDate.isAfter(today, "day") &&
          appointmentDate.isBefore(nextSunday, "day")
        );
      })
      .sort((a, b) => {
        const dateComparison = dayjs(a.date).diff(dayjs(b.date));
        if (dateComparison !== 0) return dateComparison;
        return dayjs(a.hour, "HH:mm").diff(dayjs(b.hour, "HH:mm"));
      });
  };

  const filteredAppointments =
    selectedDays.length > 0
      ? appointments.filter((appointment) =>
          selectedDays.includes(appointment.date)
        )
      : getUpcomingAppointments();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Título */}
      <Text style={styles.title}>Bienvenido, {dentistName}</Text>

      {/* Botones de navegación */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("./QRScannerScreen")}
      >
        <Text style={styles.buttonText}>Escanear QR</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push(`./Appointment/addAppointment?userId=${userId}`)}
      >
        <Text style={styles.buttonText}>Agregar Cita</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push(`./ProfileDentist?userId=${userId}`)}
      >
        <Text style={styles.buttonText}>Perfil</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push(`./Forum/CreateForum?userId=${userId}`)}
      >
        <Text style={styles.buttonText}>Crear Foro</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push(`./Forum/ListaForos?userId=${userId}`)}
      >
        <Text style={styles.buttonText}>Ver Foros</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push(`../Chat/ChatListScreen?userId=${userId}`)}
      >
        <Text style={styles.buttonText}>Ir al Chat</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push(`./Workgroup/CreateWorkgroup?dentistEmail=${dentistName}`)}
      >
        <Text style={styles.buttonText}>Crear Grupo de Trabajo</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push(`./Workgroup/ViewWorkgroupsScreen?dentistEmail=${dentistName}&userId=${userId}`)}
      >
        <Text style={styles.buttonText}>Ver Grupos de Trabajo</Text>
      </TouchableOpacity>

      {/* Calendario */}
      <TouchableOpacity style={styles.toggleButton} onPress={toggleCalendario}>
        <Text style={styles.toggleButtonText}>
          {mostrarCalendario ? "Ocultar Calendario" : "Mostrar Calendario"}
        </Text>
      </TouchableOpacity>
      {mostrarCalendario && renderCalendar()}

      {/* Citas */}
      <Text style={styles.subtitle}>
        {selectedDays.length === 0 ? "Próximas citas" : "Citas Agendadas"}
      </Text>
      <FlatList
        data={filteredAppointments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.appointmentCard}
            onPress={() =>
              router.push({
                pathname: "./Appointment/ViewAppointmentDentist",
                params: { appointment: JSON.stringify(item) },
              })
            }
          >
            <Text style={styles.appointmentText}>Paciente: {item.patientEmail}</Text>
            <Text style={styles.appointmentText}>Fecha: {item.date}</Text>
            <Text style={styles.appointmentText}>Hora: {item.hour}</Text>
            <Text style={styles.appointmentText}>Motivo: {item.reason}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay citas disponibles.</Text>}
      />
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
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  calendarContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  calendarButton: {
    width: "14%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    margin: 2,
  },
  calendarText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  toggleButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  toggleButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  appointmentCard: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "#E0F7FA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  appointmentText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginVertical: 20,
  },
});

export default MenuDentist;