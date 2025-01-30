import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { getDistance } from "geolib";

export default function Maps() {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [randomLocation, setRandomLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });

      // Generar una ubicación aleatoria dentro de 5 km
      const randomLat = latitude + (Math.random() - 0.5) * 0.09; // Aprox. 5km en latitud
      const randomLon = longitude + (Math.random() - 0.5) * 0.09; // Aprox. 5km en longitud
      setRandomLocation({ latitude: randomLat, longitude: randomLon });

      // Calcular la distancia en metros
      const dist = getDistance(
        { latitude, longitude },
        { latitude: randomLat, longitude: randomLon }
      );
      setDistance(dist);

      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={styles.container}>
      {userLocation && randomLocation ? (
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

            {/* Marcador de la ubicación aleatoria */}
            <Marker coordinate={randomLocation} title="Otro usuario" pinColor="red" />
          </MapView>

          {/* Mostrar distancia */}
          <View style={styles.distanceContainer}>
            <Text style={styles.distanceText}>Distancia al otro usuario: {distance} metros</Text>
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
    bottom: 20,
    left: 20,
    right: 20,
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
