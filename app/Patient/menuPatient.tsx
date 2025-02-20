import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { db } from "../../config/firebaseConfig";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import * as Location from "expo-location";
import dayjs from "dayjs";
import { API_CLIMA } from "../../config/apiConfig";
import { Appointment,UserData,WeatherData } from "../utils/types";
const API_KEY = API_CLIMA;

const MenuPatient: React.FC = () => {
  const { userId } = useLocalSearchParams();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showPreviousAppointments, setShowPreviousAppointments] = useState(false);
  const router = useRouter();

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
            },
          }
        );

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
      style={styles.appointmentCard}
      onPress={() =>
        router.push({
          pathname: "/Patient/Apointment/ViewAppointmentPatient",
          params: { appointment: JSON.stringify(item) },
        })
      }
    >
      <Text style={styles.appointmentText}>Fecha: {item.date}</Text>
      <Text style={styles.appointmentText}>Hora: {item.hour}</Text>
      <Text style={styles.appointmentText}>Motivo: {item.reason}</Text>
      <Text style={styles.appointmentText}>Consultorio: {item.dentalOffice}</Text>
      <Text style={styles.appointmentText}>Dentista: {item.dentistEmail}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Información del Paciente</Text>
      {userData ? (
        <View style={styles.card}>
          <Text style={styles.cardText}>Nombre: {userData.name}</Text>
          <Text style={styles.cardText}>Correo: {userData.email}</Text>
          {userData.age && <Text style={styles.cardText}>Edad: {userData.age}</Text>}
        </View>
      ) : (
        <Text>No se encontraron datos del usuario.</Text>
      )}

      <View style={styles.weatherSection}>
        <Text style={styles.subtitle}>Predicción del Clima</Text>
        {weather ? (
          <View style={styles.weatherInfo}>
            <Text style={styles.city}>{weather.name}</Text>
            <Text style={styles.temp}>{Math.round(weather.main.temp)}°C</Text>
            <Text style={styles.desc}>{weather.weather[0].description}</Text>
          </View>
        ) : (
          <Text style={styles.error}>No hay datos disponibles</Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.dentalButton}
        onPress={() =>
          router.push({
            pathname: "/Patient/AI/DentalTips",
          })
        }
      >
        <Text style={styles.dentalText}>Tips Dentales</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push(`/Patient/ProfilePatient?userId=${userId}`)}
      >
        <Text style={styles.addButtonText}>Perfil</Text>
      </TouchableOpacity>

      {/* Botón para Ir al Chat */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push(`/Chat/ChatListScreen?userId=${userId}`)}
      >
        <Text style={styles.addButtonText}>Ir al Chat</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push(`/Patient/Maps/DentisListScreen?userId=${userId}`)}
      >
        <Text style={styles.addButtonText}>Ir al Mapa</Text>
      </TouchableOpacity>

      <Text style={styles.subtitle}>Próximas Citas</Text>
      <FlatList
        data={getUpcomingAppointments()}
        keyExtractor={(item) => item.id}
        renderItem={renderAppointmentItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay citas próximas.</Text>
        }
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowPreviousAppointments(!showPreviousAppointments)}
      >
        <Text style={styles.buttonText}>
          {showPreviousAppointments ? "Ocultar Citas Previas" : "Ver Citas Previas"}
        </Text>
      </TouchableOpacity>

      {showPreviousAppointments && (
        <>
          <Text style={styles.subtitle}>Citas Previas</Text>
          <FlatList
            data={getPreviousAppointments()}
            keyExtractor={(item) => item.id}
            renderItem={renderAppointmentItem}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No hay citas previas.</Text>
            }
          />
        </>
      )}
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
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#E0F7FA",
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "flex-start",
  },
  cardText: {
    fontSize: 16,
    marginBottom: 8,
  },
  weatherSection: {
    marginTop: 20,
    alignItems: "center",
  },
  weatherInfo: {
    alignItems: "center",
    marginTop: 10,
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
    color: "#FF0000",
    fontSize: 16,
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
  button: {
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dentalButton: {
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  dentalText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  }, addButton: {
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
});

export default MenuPatient;