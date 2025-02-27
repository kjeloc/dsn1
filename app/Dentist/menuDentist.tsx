import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient"; // Para el degradado
import { Ionicons } from "@expo/vector-icons";
import { db } from "../../config/firebaseConfig";
import { collection, getDocs, doc, getDoc,addDoc, onSnapshot } from "firebase/firestore";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import dayjs from "dayjs";
import { useColorScheme } from "react-native";
import { useAppTheme } from "../Constants/Colors"; 

const MenuDentist: React.FC = () => {
  interface Appointment {
    id: string;
    date: string;
    hour: string;
    patientEmail: string;
    reason: string;
  }
  
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

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dentistName, setDentistName] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [mostrarCalendario, setMostrarCalendario] = useState(true);
  const [dentistEmail, setDentistEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null); // Foto de perfil
  const router = useRouter();
  const { userId } = useLocalSearchParams() as { userId: string };
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Colores dinámicos para modo claro/oscuro
  const backgroundColor = isDark ? "#000000" : "#FFFFFF";
  const textColor = isDark ? "#FFFFFF" : "#222222";
  const cardBackgroundColor = isDark ? "#1E1E1E" : "#FFFFFF";
  const buttonBackgroundColor = isDark ? "#9959E8a3" : "#007BFF";
  const borderColor = isDark ? "#333333" : "#CCCCCC";

  useEffect(() => {
    if (!userId) return;

    const userRef = doc(db, "userTest", userId);
    const unsubscribeUser = onSnapshot(userRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        if (userData?.state !== "Activo") {
          router.replace("/Waiting");
        }
      }
    });

    return () => unsubscribeUser(); // Limpiar el listener al desmontar el componente
  }, [userId]);

  // Cargar citas del odontólogo
  const fetchAppointments = useCallback(async () => {
    if (!userId) return;
    try {
      const querySnapshot = await getDocs(
        collection(db, "userTest", userId, "appointments")
      );
      const appointmentList = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          date: data.date,
          hour: data.hour,
          patientEmail: data.patientEmail,
          reason: data.reason,
        };
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
        const userData = userDoc.data();
        setDentistName(userData?.name || "Odontólogo");
        setDentistEmail(userData?.email || "");
        setProfilePicture(userData?.profilePicture || null); // Guardar la URL de la foto de perfil
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

  const toggleCalendario = () => setMostrarCalendario(!mostrarCalendario);

  const handleDayPress = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // Renderiza un calendario para el mes actual usando 42 celdas (6 semanas)
  const renderCalendar = () => {
    const today = dayjs();
    const firstDayOfMonth = today.startOf("month");
    const daysInMonth = today.daysInMonth();
    const startDayOfWeek = firstDayOfMonth.day(); // 0: domingo, 1: lunes, etc.
    const totalCells = 42;
    const calendarDays = [];

    for (let i = 0; i < totalCells; i++) {
      const dayNumber = i - startDayOfWeek + 1;
      if (dayNumber < 1 || dayNumber > daysInMonth) {
        calendarDays.push(null);
      } else {
        calendarDays.push(firstDayOfMonth.date(dayNumber));
      }
    }

    return (
      <View style={styles.calendarContainer}>
        {calendarDays.map((day, index) => {
          if (!day) {
            return <View key={index} style={styles.emptyDay} />;
          }
          const formattedDate = day.format("YYYY-MM-DD");
          const isPast = day.isBefore(today, "day");
          const hasAppointments = appointments.some(
            (appointment) => appointment.date === formattedDate
          );
          const isSelected = selectedDays.includes(formattedDate);
          let bgColor = cardBackgroundColor;
          if (isPast) bgColor = "#444444";
          if (hasAppointments) bgColor = "#32CD32";
          if (isSelected) bgColor = "#FFA500";

          return (
            <TouchableOpacity
              key={index}
              style={[styles.calendarButton, { backgroundColor: bgColor }]}
              onPress={() => handleDayPress(formattedDate)}
            >
              <Text style={[styles.calendarText, { color: textColor }]}>
                {day.format("DD")}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro de que deseas cerrar sesión?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Aceptar",
          onPress: async () => {
            try {
              // Registrar log de cierre de sesión
              if (userId) {
                await logAction(userId as string, "Cierre de sesión");
              }

              // Lógica para cerrar sesión
              router.replace("/");
            } catch (error) {
              console.error("Error al registrar el log de cierre de sesión:", error);
            }
          },
        },
      ]
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
        const diff = dayjs(a.date).diff(dayjs(b.date));
        if (diff !== 0) return diff;
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
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={textColor} />
      </View>
    );
  }

  // Componente de cabecera para la FlatList principal
  const ListHeader = () => (
    <View style={styles.headerContainer}>
      {/* Tarjeta con degradado */}
      <LinearGradient
        colors={isDark ? ["#1E1E1E", "#333333"] : ["#FFFFFF", "#E0F7FA"]}
        style={styles.profileCard}
      >
        {/* Foto de perfil e información */}
        <View style={styles.profileSection}>
          {profilePicture ? (
            <Image
              source={{ uri: profilePicture }}
              style={styles.profilePicture}
            />
          ) : (
            <Ionicons name="person-circle" size={60} color={textColor} />
          )}
          <View style={styles.welcomeTextContainer}>
            <Text style={[styles.welcomeText, { color: textColor }]}>
              Bienvenido, {dentistName || "Odontólogo"}
            </Text>
            <TouchableOpacity
              style={[styles.profileButton, { backgroundColor: buttonBackgroundColor }]}
              onPress={() => router.push(`/Dentist/ProfileDentist?userId=${userId}`)}
            >
              <Text style={[styles.profileButtonText]}>
                Ir al perfil
              </Text>
            </TouchableOpacity>
                    {/* Botón de Logout */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            { backgroundColor: colorScheme === "dark" ? "#FF4D4D" : "#FF4D4D" },
          ]}
          onPress={handleLogout}
        >
          <Text
            style={[
              styles.logoutButtonText,
              { color: colorScheme === "dark" ? "#FFFFFF" : "#FFFFFF" },
            ]}
          >
            Cerrar Sesión
          </Text>
        </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Menú principal horizontal */}
      <FlatList
        data={buttons}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.buttonListContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: buttonBackgroundColor },
            ]}
            onPress={item.onPress}
          >
            <Ionicons name={item.icon as any} size={24} color="#fff" />
            <Text style={styles.buttonText}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Botón para mostrar/ocultar el calendario */}
      <TouchableOpacity
        style={[
          styles.toggleCalendarButton,
          { backgroundColor: "rgba(153, 152, 152, 0.29)" },
        ]}
        onPress={toggleCalendario}
      >
        <Text style={[styles.toggleCalendarText, { color: textColor }]}>
          {mostrarCalendario ? "Ocultar Calendario" : "Mostrar Calendario"}
        </Text>
      </TouchableOpacity>

      {/* Calendario */}
      {mostrarCalendario && renderCalendar()}

      {/* Subtítulo */}
      <Text style={[styles.subtitle, { color: textColor }]}>
        {selectedDays.length === 0 ? "Próximas citas" : "Citas Agendadas"}
      </Text>
    </View>
  );

  // Botones del menú principal
  const buttons = [
    {
      icon: "qr-code",
      label: "Escanear QR",
      onPress: () =>
        router.push({
          pathname: "/Dentist/QRScannerScreen2",
          params: { appointments: JSON.stringify(appointments) },
        }),
    },
    {
      icon: "calendar-outline",
      label: "Citas Solicitadas",
      onPress: () =>
        router.push(
          `/Dentist/Appointment/RequestedAppointments?dentistEmail=${dentistEmail}&userId=${userId}`
        ),
    },
    {
      icon: "calendar",
      label: "Agregar Cita",
      onPress: () => router.push(`/Dentist/Appointment/addAppointment?userId=${userId}`),
    },
    {
      icon: "chatbubbles",
      label: "Ir al Chat",
      onPress: () => router.push(`/Chat/ChatListScreen?userId=${userId}`),
    },
    {
      icon: "create",
      label: "Crear Foro",
      onPress: () => router.push(`/Dentist/Forum/CreateForum?userId=${userId}`),
    },
    {
      icon: "list",
      label: "Ver Foros",
      onPress: () => router.push(`/Dentist/Forum/ListaForos?userId=${userId}`),
    },
    {
      icon: "people",
      label: "Crear Grupo",
      onPress: () =>
        router.push(`/Dentist/WorkGroup/CreateWorkgroup?dentistEmail=${dentistEmail}`),
    },
    {
      icon: "people-outline",
      label: "Ver Grupos",
      onPress: () =>
        router.push(
          `/Dentist/WorkGroup/ViewWorkgroupsScreen?dentistEmail=${dentistEmail}&userId=${userId}`
        ),
    },
   
  ];

  return (
    <View style={[styles.container, { backgroundColor }]}>
    <FlatList
      data={filteredAppointments}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={ListHeader}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.appointmentCard, { backgroundColor: cardBackgroundColor }]}
          onPress={() =>
            router.push({
              pathname: "/Dentist/Appointment/ViewAppointmentDentist",
              params: { appointment: JSON.stringify(item) },
            })
          }
        >
          <Text style={[styles.appointmentText, { color: textColor }]}>
            Paciente: {item.patientEmail}
          </Text>
          <Text style={[styles.appointmentText, { color: textColor }]}>
            Fecha: {item.date} - Hora: {item.hour}
          </Text>
          <Text style={[styles.appointmentText, { color: textColor }]}>
            Motivo: {item.reason}
          </Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <Text style={[styles.emptyText, { color: textColor }]}>
          No hay citas para los días seleccionados.
        </Text>
      }
      contentContainerStyle={styles.contentContainer}
    />
  </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 20,
  },
  profileCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  profilePicture: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 10,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  profileButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: "#007BFF",
    borderRadius: 5,
    alignSelf: "flex-start",
    marginTop: 5,
  },
  profileButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    marginVertical: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonListContainer: {
    flexDirection: "row",
    marginBottom: 20,
    height: 100,
    alignItems: "center",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 8,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: "rgb(255, 255, 255)",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "center",
  },
  toggleCalendarButton: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  toggleCalendarText: {
    fontSize: 16,
    fontWeight: "600",
  },
  calendarContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 20,
  },
  calendarButton: {
    padding: 12,
    margin: 4,
    borderRadius: 8,
    width: "13%",
    alignItems: "center",
  },
  calendarText: {
    fontSize: 16,
    fontWeight: "600",
  },
  appointmentCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  appointmentText: {
    fontSize: 16,
    marginBottom: 4,
  },
  emptyDay: {
    width: "13%",
    margin: 4,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 18,
    marginVertical: 20,
  },
  logoutButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#007BFF",
    borderRadius: 5,
    alignSelf: "flex-start",
    marginTop: 5,
  },
  logoutButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});

export default MenuDentist;