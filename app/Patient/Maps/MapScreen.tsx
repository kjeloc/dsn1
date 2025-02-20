// app/MapScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import MapView, { Marker } from "react-native-maps";
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
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={styles.container}>
      {userLocation && dentistLocation ? (
        <>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {/* Marcador de la ubicación del usuario */}
            <Marker coordinate={userLocation} title="Tu ubicación" pinColor="blue" />

            {/* Marcador de la ubicación del odontólogo */}
            <Marker
              coordinate={dentistLocation}
              title={dentistName || "Odontólogo"} // Usar el nombre del odontólogo aquí
              pinColor="red"
            />
          </MapView>

          {/* Mostrar distancia */}
          <View style={styles.distanceContainer}>
            <Text style={styles.distanceText}>
              Distancia al odontólogo: {distance ? `${(distance / 1000).toFixed(2)} km` : "Calculando..."}
            </Text>
          </View>
        </>
      ) : (
        <Text>No se pudo obtener la ubicación</Text>
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
    top: 20, // Cambia la posición vertical (desde la parte superior)
    right: 20, // Cambia la posición horizontal (desde la derecha)
    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    elevation: 5,
  },
  distanceText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});