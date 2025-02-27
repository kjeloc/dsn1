import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Image, ImageBackground } from "react-native";
import { db } from "../../config/firebaseConfig";
import { collection, getDocs, doc, getDoc, addDoc, query, onSnapshot, updateDoc } from "firebase/firestore";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import dayjs from "dayjs";
import { API_CLIMA } from "../../config/apiConfig";
import { Appointment, UserData, WeatherData } from "../utils/types";
import { useAppTheme } from "../Constants/Colors"; // Importar los colores dinámicos
import { LinearGradient } from "expo-linear-gradient";

const API_KEY = API_CLIMA;

const MenuPatient: React.FC = () => {
  const { userId } = useLocalSearchParams();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const theme = useAppTheme(); // Obtener el tema dinámico
  const buttonBackgroundColor = theme.mode === "dark" ? "#9959E8a3" : "#007BFF";
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showPreviousAppointments, setShowPreviousAppointments] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    // Consulta para escuchar citas del paciente
    const appointmentsRef = collection(db, "userTest", userId as string, "appointments");
    const q = query(appointmentsRef);

    const unsubscribe = onSnapshot(appointmentsRef, async (querySnapshot) => {
      querySnapshot.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          const appointmentData = change.doc.data();
          const appointmentId = appointmentData.id;
          if (!appointmentData.notified) {
            // Mostrar notificación local
            Notifications.scheduleNotificationAsync({
              content: {
                title: "¡Cita agendada!",
                body: `Tienes una Cita programada para el ${appointmentData.date} a las ${appointmentData.hour}.`,
                data: { appointmentData,appointmentId,userId }, // Datos adicionales para redirección
              },
              trigger: null, // Notificación inmediata
            });

            // Redirigir al usuario si está activo
            Alert.alert(
              "Nueva Cita",
              `Tienes una nueva cita programada para el ${appointmentData.date} a las ${appointmentData.hour}.`,
              [
                {
                  text: "Ver Cita",
                  onPress: () =>
                    router.push({
                      pathname: "/Patient/Apointment/ViewAppointmentPatient",
                      params: { appointment: JSON.stringify({ id: appointmentId, ...appointmentData }) },
                    }),
                },
                { text: "Cancelar", style: "cancel" },
              ]
            );
            // Actualizar el atributo `notified` en Firestore
            const appointmentRef = doc(db, "userTest", userId as string, "appointments", appointmentId);
            await updateDoc(appointmentRef, { notified: true });
          }
        }
      });
      setLoading(false);
    },
      (error) => {
        console.error("Error al escuchar citas:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe(); // Limpiar el listener al desmontar el componente
  }, [userId]);
  useEffect(() => {
    if (!userId) return;
    const appointmentsRef = collection(db, "userTest", userId as string, "appointments");
    const unsubscribe = onSnapshot(appointmentsRef, async (querySnapshot) => {
      querySnapshot.docChanges().forEach(async (change) => {
        if (change.type === "added" || change.type === "modified") {
          const appointmentData = change.doc.data();
          const appointmentId = change.doc.id;
          // Verificar si la cita ya fue notificada
          if (!appointmentData.notified) {
            // Actualizar el atributo `notified` en Firestore
            const appointmentRef = doc(db, "userTest", userId as string, "appointments", appointmentId);
            await updateDoc(appointmentRef, { notified: true });
          }
        }
      });
    });

    return () => unsubscribe(); // Limpiar el listener al desmontar el componente
  }, [userId]);

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
    const fetchUserData = async () => {
      if (!userId) return;
      try {
        const userDoc = await getDoc(doc(db, "userTest", userId as string));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        }
      } catch (error) {
        console.error("Error al obtener los datos del usuario:", error);
      }
    };

    const fetchAppointments = async () => {
      if (!userId) return;
      try {
        const querySnapshot = await getDocs(collection(db, "userTest", userId as string, "appointments"));
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
    };

    const fetchWeatherData = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permiso denegado", "Se requiere acceso a la ubicación.");
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather`,
          {
            params: {
              lat: latitude,
              lon: longitude,
              appid: API_KEY,
              units: "metric",
              lang: "es",
            },
          }
        );
        console.log("Respuesta del clima:", response.data);
        setWeather(response.data);
      } catch (error) {
        console.error("Error al obtener el clima:", error);
        setWeather(null);
      }
    };

    fetchUserData();
    fetchAppointments();
    fetchWeatherData();
  }, [userId]);

  const getUpcomingAppointments = () => {
    const today = dayjs();
    return appointments
      .filter((appointment) => dayjs(appointment.date).isAfter(today, "day"))
      .sort((a, b) => {
        const dateComparison = dayjs(a.date).diff(dayjs(b.date));
        if (dateComparison !== 0) return dateComparison;
        return dayjs(a.hour, "HH:mm").diff(dayjs(b.hour, "HH:mm"));
      });
  };

  const getPreviousAppointments = () => {
    const today = dayjs();
    return appointments
      .filter((appointment) => dayjs(appointment.date).isBefore(today, "day"))
      .sort((a, b) => {
        const dateComparison = dayjs(b.date).diff(dayjs(a.date)); // Orden descendente (más reciente primero)
        if (dateComparison !== 0) return dateComparison;
        return dayjs(b.hour, "HH:mm").diff(dayjs(a.hour, "HH:mm"));
      });
  };

  const renderAppointmentItem = ({ item }: { item: Appointment }) => (
    <TouchableOpacity
      style={[styles.appointmentCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={() =>
        router.push({
          pathname: "/Patient/Apointment/ViewAppointmentPatient",
          params: { appointment: JSON.stringify(item),userId },
        })
      } key={item.id}
    >
      <Text style={[styles.appointmentText, { color: theme.text }]}>Fecha: {item.date}</Text>
      <Text style={[styles.appointmentText, { color: theme.text }]}>Hora: {item.hour}</Text>
      <Text style={[styles.appointmentText, { color: theme.text }]}>Motivo: {item.reason}</Text>
      <Text style={[styles.appointmentText, { color: theme.text }]}>Consultorio: {item.dentalOffice}</Text>
      <Text style={[styles.appointmentText, { color: theme.text }]}>Dentista: {item.dentistEmail}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const CardWithBackground: React.FC<{ title: string; imageSource: any; onPress: () => void }> = ({ title, imageSource, onPress }) => {
    return (
      <TouchableOpacity onPress={onPress} style={styles.cardButtomContainer}>
        <ImageBackground source={imageSource} style={styles.cardButtomBackground} imageStyle={styles.imageStyle}>
          {/* Gradiente de desvanecimiento */}
          <LinearGradient colors={[theme.mode === "dark" ? "rgba(153, 152, 152, 0.29)" : "rgba(128, 128, 128, 0.32)", "transparent",
          ]}
            style={styles.gradientOverlay}
          />
          {/* Título de la tarjeta */}
          <Text style={[styles.cardButtomTitle, { color: theme.textPrimary }]}>{title}</Text>
        </ImageBackground>
      </TouchableOpacity>
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


  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>

      <View style={styles.userSection}>
        {/* Gradiente de fondo */}
        <LinearGradient colors={[theme.mode === "dark" ? "rgba(73, 73, 73, 0.3)" : "rgba(163, 163, 163, 0.32)", "transparent",
        ]}
          style={styles.gradientOverlay}
        />
        {/* Bienvenida y datos del usuario */}
        <View style={styles.userInfo}>
          <Text style={[styles.welcomeText, { color: theme.text }]}>Bienvenido, {userData?.name}!</Text>
        </View>
        {/* Contenido */}
        <View style={styles.profileImageContainer}>
          <Image
            source={{ uri: userData?.profilePicture || "https://via.placeholder.com/150" }}
            style={styles.profileImage}
          />
        </View>
        <TouchableOpacity
          style={[styles.profileButton, { backgroundColor: buttonBackgroundColor }]}
          onPress={() => router.push(`/Patient/ProfilePatient?userId=${userId}`)}
        >
          <Text style={[styles.profileButtonText]}>
            Ir al perfil
          </Text>
        </TouchableOpacity>
        {/* Botón de Logout */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            { backgroundColor: theme.mode === "dark" ? "#FF4D4D" : "#FF4D4D" },
          ]}
          onPress={handleLogout}
        >
          <Text
            style={[
              styles.logoutButtonText,
              { color: theme.mode === "dark" ? "#FFFFFF" : "#FFFFFF" },
            ]}
          >
            Cerrar Sesión
          </Text>
        </TouchableOpacity>


      </View>
      {/* Predicción del Clima */}
      <View style={styles.weatherSection}>
        <Text style={[styles.subtitle, { color: theme.text }]}>Predicción del Clima</Text>
        {weather ? (
          <View style={[styles.weatherInfo, { backgroundColor: theme.cardWeather, borderColor: theme.border }]}>
            <Text style={[styles.city, { color: theme.text }]}>{weather.name}</Text>
            <Image source={{ uri: `http://openweathermap.org/img/w/${weather.weather[0].icon}.png` }} style={{ width: 50, height: 50 }} />
            <Text style={[styles.temp, { color: theme.text }]}>{Math.round(weather.main.temp)}°C</Text>
            <Text style={[styles.desc, { color: theme.text }]}>{weather.weather[0].description}</Text>

          </View>
        ) : (
          <Text style={[styles.error, { color: theme.error }]}>No hay datos disponibles</Text>
        )}
      </View>
      {/* Próximas Citas */}
      <Text style={[styles.subtitle, { color: theme.text }]}>Próximas Citas</Text>
      <View>
        {getUpcomingAppointments().length !== 0 ? getUpcomingAppointments().map((appointment, key) => (
          renderAppointmentItem({ item: appointment })
        ),) : <Text style={[styles.emptyText, { color: theme.text }]}>No hay citas próximas.</Text>}
      </View>
      {/* Botón para Ver/Ocultar Citas Previas */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.button }]}
        onPress={() => setShowPreviousAppointments(!showPreviousAppointments)}
      >
        <Text style={[styles.buttonText, { color: theme.text }]}>
          {showPreviousAppointments ? "Ocultar Citas Previas" : "Ver Citas Previas"}
        </Text>
      </TouchableOpacity>


      {/* Citas Previas */}
      {showPreviousAppointments && (
        <>
          <Text style={[styles.subtitle, { color: theme.text }]}>Citas Previas</Text>
          <ScrollView horizontal contentContainerStyle={{ alignItems: "center", gap: 10 }}>

            {getPreviousAppointments().map((appointment) => (
              renderAppointmentItem({ item: appointment })
            ),)}

          </ScrollView>
        </>
      )}

      <View style={styles.container}>

        {/* Tarjeta para Tips Dentales */}
        <CardWithBackground
          title="Tips Dentales"
          imageSource={require("../../assets/images/dentista.png")} // Reemplaza con tu imagen
          onPress={() =>
            router.push({
              pathname: "/Patient/AI/DentalTips",
            })
          }
        />

        {/* Tarjeta para Ir al Chat */}
        <CardWithBackground
          title="Ir al Chat"
          imageSource={require("../../assets/images/chat.png")} // Reemplaza con tu imagen
          onPress={() => router.push(`/Chat/ChatListScreen?userId=${userId}`)}
        />

        {/* Tarjeta para Ir al Mapa */}
        <CardWithBackground
          title="Ir al Mapa"
          imageSource={require("../../assets/images/mapa.png")} // Reemplaza con tu imagen
          onPress={() => router.push(`/Patient/Maps/DentisListScreen?userId=${userId}`)}
        />

        {/* Tarjeta para Gestionar Citas */}
        <CardWithBackground
          title="Ir a la Gestión de Citas"
          imageSource={require("../../assets/images/chequeo-dental.png")} // Reemplaza con tu imagen
          onPress={() => router.push(`/Patient/Apointment/RequestAppointment?userId=${userId}`)}
        />



      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  card: {
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "flex-start",
  },
  cardText: {
    fontSize: 16,
    marginBottom: 5,
  },
  weatherSection: {
    marginTop: 0,
    alignItems: "center",
    transform: [{ translateY: -30 }], // Mover hacia arriba
  },
  weatherInfo: {
    alignItems: "center",
    marginTop: 0,
  },
  city: {
    fontSize: 20,
    fontWeight: "bold",
  },
  temp: {
    fontSize: 24,
    fontWeight: "600",
  },
  desc: {
    fontSize: 16,
    textTransform: "capitalize",
  },
  error: {
    fontSize: 16,
  },
  appointmentCard: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  appointmentText: {
    fontSize: 16,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    marginVertical: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dentalButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  dentalText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  addButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  userSection: {
    alignItems: "center",
    paddingVertical: 20,
    borderRadius: 8,
    marginBottom: 20,
    overflow: "hidden", // Asegura que la imagen no se desborde
  },
  profileImageContainer: {
    width: 150,
    height: 150,
    borderRadius: 75, // Hace que la imagen sea un círculo
    overflow: "hidden",
    marginBottom: 0,
    alignSelf: "center",
    position: "relative",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  userInfo: {
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  userDataText: {
    fontSize: 16,
    marginBottom: 5,
    textAlign: "center",
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardButtomContainer: {
    marginBottom: 20,
    borderRadius: 10,
    overflow: "hidden",
    elevation: 5, // Sombra en Android
    shadowColor: "#000", // Sombra en iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  cardButtomBackground: {
    width: "100%",
    height: 150,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  imageButtomStyle: {
    resizeMode: "cover",
  },
  CardgradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardButtomTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 5,
  },
  Cardcontainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F9F9F9",
  },
  imageStyle: {
    resizeMode: "cover",
    width: 150, // Ancho fijo en píxeles
    height: 110, // Alto fijo en píxeles
    position: "relative",
    top: 0,
  },
  profileButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#007BFF",
    borderRadius: 5,
    alignSelf: "center",
    marginTop: 5,
  },
  profileButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  logoutButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#007BFF",
    borderRadius: 5,
    alignSelf: "center",
    marginTop: 5,
  },
  logoutButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});

export default MenuPatient;