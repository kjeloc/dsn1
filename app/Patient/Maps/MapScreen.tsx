// app/MapScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, useColorScheme } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { getDistance } from "geolib";
import { db } from "../../../config/firebaseConfig";
import { useLocalSearchParams } from "expo-router";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function MapScreen() {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [dentistLocation, setDentistLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [dentistName, setDentistName] = useState<string | null>(null); // Nuevo estado para el nombre del odontólogo
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { dentistEmail } = useLocalSearchParams<{ dentistEmail: string }>();
  const colorScheme = useColorScheme(); // Detectar el esquema de color

  // Colores dinámicos para el modo claro/oscuro
  const backgroundColor = colorScheme === "dark" ? "#121212" : "#fff";
  const textColor = colorScheme === "dark" ? "#fff" : "#000";
  const cardBackgroundColor = colorScheme === "dark" ? "#1e1e1e" : "#f9f9f9";
  const borderColor = colorScheme === "dark" ? "#333" : "#ddd";

  // Estilo del mapa para el modo oscuro
  const darkMapStyle = [
    {
      elementType: "geometry",
      stylers: [{ color: "#242f3e" }],
    },
    {
      elementType: "labels.text.fill",
      stylers: [{ color: "#746855" }],
    },
    {
      elementType: "labels.text.stroke",
      stylers: [{ color: "#242f3e" }],
    },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#263c3f" }],
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#6b9a76" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#38414e" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#212a37" }],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9ca5b3" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#746855" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#1f2835" }],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: "#f3d19c" }],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#2f3948" }],
    },
    {
      featureType: "transit.station",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#17263c" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#515c6d" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#17263c" }],
    },
  ];

  // Obtener la ubicación del usuario
  const getUserLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permiso para acceder a la ubicación fue denegado");
        setLoading(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });
    } catch (error) {
      console.error("Error al obtener la ubicación del usuario:", error);
      setLoading(false);
    }
  };

  // Obtener la ubicación y el nombre del odontólogo desde Firestore
  const getDentistLocation = async () => {
    try {
      if (!dentistEmail) {
        throw new Error("No se proporcionó el correo del odontólogo");
      }
      const q = query(collection(db, "userTest"), where("email", "==", dentistEmail));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        throw new Error(`El odontólogo ${dentistEmail} no existe`);
      }
      const dentistDoc = querySnapshot.docs[0];
      const dentistData = dentistDoc.data();
      const { AcPos, name } = dentistData;
      if (!AcPos || !AcPos.latitude || !AcPos.longitude) {
        throw new Error("La ubicación del odontólogo no está definida");
      }
      setDentistLocation({
        latitude: AcPos.latitude,
        longitude: AcPos.longitude,
      });
      // Guardar el nombre del odontólogo
      setDentistName(name || "Odontólogo desconocido");
    } catch (error) {
      console.error("Error al obtener la ubicación del odontólogo:", error);
    }
  };

  // Calcular la distancia entre el usuario y el odontólogo
  const calculateDistance = () => {
    if (userLocation && dentistLocation) {
      const dist = getDistance(
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        { latitude: dentistLocation.latitude, longitude: dentistLocation.longitude }
      );
      setDistance(dist);
    }
  };

  useEffect(() => {
    getUserLocation(); // Obtener la ubicación del usuario
    getDentistLocation(); // Obtener la ubicación y el nombre del odontólogo
  }, []);

  useEffect(() => {
    if (userLocation && dentistLocation) {
      calculateDistance();
      setLoading(false);
    }
  }, [userLocation, dentistLocation]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <ActivityIndicator size="large" color={colorScheme === "dark" ? "#fff" : "#000"} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {userLocation && dentistLocation ? (
        <>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            customMapStyle={colorScheme === "dark" ? darkMapStyle : []} // Aplicar estilo oscuro si está en modo oscuro
          >
            {/* Marcador de la ubicación del usuario */}
            <Marker coordinate={userLocation} title="Tu ubicación" pinColor={colorScheme === "dark" ? "#87CEEB" : "blue"} />
            {/* Marcador de la ubicación del odontólogo */}
            <Marker
              coordinate={dentistLocation}
              title={dentistName || "Odontólogo"}
              pinColor={colorScheme === "dark" ? "#FF4500" : "red"}
            />
          </MapView>
          {/* Mostrar distancia */}
          <View style={[styles.distanceContainer, { backgroundColor: cardBackgroundColor, borderColor }]}>
            <Text style={[styles.distanceText, { color: textColor }]}>
              Distancia al odontólogo: {distance ? `${(distance / 1000).toFixed(2)} km` : "Calculando..."}
            </Text>
          </View>
        </>
      ) : (
        <Text style={{ color: textColor }}>No se pudo obtener la ubicación</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  distanceContainer: {
    position: "absolute",
    top: 20,
    right: 20,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    elevation: 5,
  },
  distanceText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});