import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { db } from "../config/firebaseConfig";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import dayjs from "dayjs";

interface Appointment {
  id: string;
  patientEmail: string;
  date: string;
  hour: string;
  reason: string;
  dentalOffice: string;
  dentistEmail: string;
}

const MenuDentist: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dentistName, setDentistName] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [mostrarCalendario, setMostrarCalendario] = useState(true);
  const toggleCalendario = () => setMostrarCalendario(!mostrarCalendario);

  // Cargar citas del odontólogo
  const fetchAppointments = useCallback(async () => {
    if (!userId) return;
    try {
      const querySnapshot = await getDocs(
        collection(db, "userTest", userId, "appointments")
      );
      const appointmentList: Appointment[] = [];
      querySnapshot.forEach((doc) => {
        appointmentList.push({
          id: doc.id,
          ...doc.data(),
        } as Appointment);
      });
      setAppointments(appointmentList);
    } catch (error) {
      console.error("Error al obtener las citas:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Cargar datos del odontólogo
  const fetchDentistData = useCallback(async () => {
    if (!userId) return;
    try {
      const userDoc = await getDoc(doc(db, "userTest", userId));
      if (userDoc.exists()) {
        setDentistName(userDoc.data()?.name || "Menu Dentista");
      }
    } catch (error) {
      console.error("Error al obtener el nombre del dentista:", error);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchDentistData();
      fetchAppointments();
    }, [fetchDentistData, fetchAppointments])
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
    <FlatList
      ListHeaderComponent={
        <>
          {dentistName && (
            <Text style={styles.title}>Bienvenido, {dentistName}</Text>
          )}
          {/* Botón para ir a QRScannerScreen */}
          <TouchableOpacity
            style={styles.qrButton}
            onPress={() =>
              router.push({
                pathname: "/QRScannerScreen",
                params: { appointments: JSON.stringify(appointments) },
              })
            }
          >
            <Text style={styles.qrButtonText}>Escanear QR</Text>
          </TouchableOpacity>

          {/* Botón para Agregar Cita */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push(`/addAppointment?userId=${userId}`)}
          >
            <Text style={styles.addButtonText}>Agregar Cita</Text>
          </TouchableOpacity>

          {/* Botón para Perfil */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push(`/ProfileDentist?userId=${userId}`)}
          >
            <Text style={styles.addButtonText}>Perfil</Text>
          </TouchableOpacity>

          {/* Botón para Crear Foro */}
    <TouchableOpacity style={styles.addButton} onPress={() => router.push(`/CreateForum?userId=${userId}`)}>
      <Text style={styles.addButtonText}>Crear Foro</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.addButton} onPress={() => router.push(`/ListaForos?userId=${userId}`)}>
      <Text style={styles.addButtonText}>Ver Foros</Text>
    </TouchableOpacity>


          {/* Botón para Ir al Chat */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push(`/ChatListScreen?userId=${userId}`)}
          >
            <Text style={styles.addButtonText}>Ir al Chat</Text>
          </TouchableOpacity>
          

          {/* Calendario */}
          <TouchableOpacity onPress={toggleCalendario}>
            <Text style={styles.subtitle}>
              {mostrarCalendario ? "Ocultar Calendario" : "Mostrar Calendario"}
            </Text>
          </TouchableOpacity>
          {mostrarCalendario && renderCalendar()}

          {/* Subtítulo */}
          <Text style={styles.subtitle}>
            {selectedDays.length === 0 ? "Próximas citas" : "Citas Agendadas"}
          </Text>
        </>
      }
      data={filteredAppointments}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.appointmentCard}
          onPress={() =>
            router.push({
              pathname: "/ViewAppointmentDentist",
              params: { appointment: JSON.stringify(item) },
            })
          }
        >
          <Text style={styles.appointmentText}>
            Paciente: {item.patientEmail}
          </Text>
          <Text style={styles.appointmentText}>Fecha: {item.date}</Text>
          <Text style={styles.appointmentText}>Hora: {item.hour}</Text>
          <Text style={styles.appointmentText}>Motivo: {item.reason}</Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <Text style={styles.emptyText}>
          No hay citas para los días seleccionados.
        </Text>
      }
    />
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
    padding: 10,
    margin: 2,
    borderRadius: 4,
    width: "13%",
    alignItems: "center",
  },
  calendarText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  appointmentCard: {
    backgroundColor: "#E0F7FA",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  appointmentText: {
    fontSize: 16,
    color: "#333",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginVertical: 20,
  },
  addButton: {
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  qrButton: {
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  qrButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default MenuDentist;
