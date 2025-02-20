import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, ScrollView,Image } from "react-native";
import { db } from "../../config/firebaseConfig";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import * as Location from "expo-location";
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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showPreviousAppointments, setShowPreviousAppointments] = useState(false);
  const router = useRouter();
  const theme = useAppTheme(); // Obtener el tema dinámico

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
          params: { appointment: JSON.stringify(item) },
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

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>

      <View style={styles.userSection}>
  {/* Gradiente de fondo */}
  <LinearGradient
    colors={["rgba(49, 46, 46, 0.53)", "transparent"]}
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
</View>
      {/* Predicción del Clima */}
      <View style={styles.weatherSection}>
        <Text style={[styles.subtitle, { color: theme.text }]}>Predicción del Clima</Text>
        {weather ? (
          <View style={[styles.weatherInfo, { backgroundColor: theme.card, borderColor: theme.border }]}>
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
      {/* <FlatList
        data={getUpcomingAppointments()}
        keyExtractor={(item) => item.id}
        renderItem={renderAppointmentItem}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.text }]}>No hay citas próximas.</Text>
        }
      /> */}
      <View>
        {getUpcomingAppointments().length!==0?getUpcomingAppointments().map((appointment,key) => (
         renderAppointmentItem({ item: appointment })
        ),):<Text style={[styles.emptyText, { color: theme.text }]}>No hay citas próximas.</Text>}
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
          {/* <FlatList
            data={getPreviousAppointments()}
            keyExtractor={(item) => item.id}
            renderItem={renderAppointmentItem}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: theme.text }]}>No hay citas previas.</Text>
            }
          /> */}
          <ScrollView horizontal contentContainerStyle={{ alignItems: "center", gap: 10 }}>

            {getPreviousAppointments().map((appointment) => (
              renderAppointmentItem({ item: appointment })
            ),)}
  
          </ScrollView>
        </>
      )}

      {/* Botones de Acción */}
      <TouchableOpacity
        style={[styles.dentalButton, { backgroundColor: theme.button }]}
        onPress={() =>
          router.push({
            pathname: "/Patient/AI/DentalTips",
          })
        }
      >
        <Text style={[styles.dentalText, { color: theme.text }]}>Tips Dentales</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.button }]}
        onPress={() => router.push(`/Patient/ProfilePatient?userId=${userId}`)}
      >
        <Text style={[styles.addButtonText, { color: theme.text }]}>Perfil</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.button }]}
        onPress={() => router.push(`/Chat/ChatListScreen?userId=${userId}`)}
      >
        <Text style={[styles.addButtonText, { color: theme.text }]}>Ir al Chat</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.button }]}
        onPress={() => router.push(`/Patient/Maps/DentisListScreen?userId=${userId}`)}
      >
        <Text style={[styles.addButtonText, { color: theme.text }]}>Ir al Mapa</Text>
      </TouchableOpacity>

     

     
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
});

export default MenuPatient;