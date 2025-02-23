import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useColorScheme,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Para íconos
import { db } from "../../../config/firebaseConfig";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export default function DentistListScreen() {
  const [dentists, setDentists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter(); // Usar el hook de navegación
  const colorScheme = useColorScheme(); // Detectar el esquema de color (light/dark)

  // Colores dinámicos para el modo claro/oscuro
  const backgroundColor = colorScheme === "dark" ? "#121212" : "#fff";
  const cardBackgroundColor = colorScheme === "dark" ? "#1e1e1e" : "#f9f9f9";
  const textColor = colorScheme === "dark" ? "#fff" : "#000";
  const secondaryTextColor = colorScheme === "dark" ? "#ccc" : "#666";
  const borderColor = colorScheme === "dark" ? "#333" : "#ddd";

  // Obtener todos los odontólogos asociados al paciente
  const getAssociatedDentists = async () => {
    try {
      const patientID = userId; // ID del paciente logueado
      console.log("Buscando paciente con ID:", patientID); // Depuración
      // Acceder directamente al documento del paciente usando su ID
      const patientRef = doc(db, "userTest", patientID);
      const patientDoc = await getDoc(patientRef);
      if (!patientDoc.exists()) {
        throw new Error(`El paciente con el ID ${patientID} no existe`);
      }
      const patientData = patientDoc.data();
      console.log("Datos del paciente encontrados:", patientData); // Depuración
      const dentistsArray = patientData?.dentists;
      if (!Array.isArray(dentistsArray) || dentistsArray.length === 0) {
        throw new Error("No hay odontólogos asociados a este paciente");
      }
      const dentistsData = await Promise.all(
        dentistsArray.map(async (dentistEmail: string) => {
          console.log(`Buscando odontólogo con email: ${dentistEmail}`); // Depuración
          // Buscar el odontólogo en la colección userTest usando el campo 'email'
          const qDentist = query(collection(db, "userTest"), where("email", "==", dentistEmail));
          const dentistQuerySnapshot = await getDocs(qDentist);
          if (dentistQuerySnapshot.empty) {
            console.warn(`El odontólogo con email ${dentistEmail} no existe`); // Depuración
            return null; // Ignorar este odontólogo
          }
          const dentistDoc = dentistQuerySnapshot.docs[0];
          const { name, AcPos, rol, state, profilePicture } = dentistDoc.data();
          // Validar que sea un dentista activo
          if (rol !== "Dentist") {
            console.warn(`El usuario con email ${dentistEmail} no es un dentista (rol: ${rol})`); // Depuración
            return null; // Ignorar este odontólogo
          }
          // Validar que AcPos exista y tenga las propiedades latitude y longitude
          if (!AcPos || typeof AcPos.latitude !== "number" || typeof AcPos.longitude !== "number") {
            console.warn(`La ubicación del odontólogo con email ${dentistEmail} no está definida correctamente`); // Depuración
            return null; // Ignorar este odontólogo
          }
          return {
            email: dentistEmail,
            name: name || "Odontólogo desconocido",
            location: { latitude: AcPos.latitude, longitude: AcPos.longitude },
            profilePicture: profilePicture || null, // Agregar el campo de foto de perfil
          };
        })
      );
      // Filtrar los odontólogos válidos (ignorar los que son null)
      const validDentists = dentistsData.filter((dentist) => dentist !== null);
      console.log("Odontólogos válidos encontrados:", validDentists); // Depuración
      setDentists(validDentists);
    } catch (error) {
      console.error("Error al obtener los odontólogos asociados:", error);
      if (error instanceof Error) {
        Alert.alert("Error", error.message); // Mostrar un mensaje de error al usuario
      } else {
        Alert.alert("Error", "Ocurrió un error desconocido"); // Mensaje genérico para errores desconocidos
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAssociatedDentists();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <ActivityIndicator size="large" color={colorScheme === "dark" ? "#fff" : "#000"} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <FlatList
        data={dentists}
        keyExtractor={(item) => item.email}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.dentistCard, { backgroundColor: cardBackgroundColor, borderColor }]}
            onPress={() =>
              router.push(`/Patient/Maps/MapScreen?dentistEmail=${item.email}`)
            }
          >
            <View style={styles.cardHeader}>
              {item.profilePicture ? (
                <Image
                  source={{ uri: item.profilePicture }}
                  style={styles.profilePicture}
                />
              ) : (
                <Ionicons
                  name="person-circle-outline"
                  size={40}
                  color={colorScheme === "dark" ? "#ccc" : "#333"}
                />
              )}
              <View style={styles.cardContent}>
                <Text style={[styles.dentistName, { color: textColor }]}>{item.name}</Text>
                <Text style={[styles.dentistEmail, { color: secondaryTextColor }]}>
                  {item.email}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
            No hay odontólogos asociados.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  dentistCard: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardContent: {
    marginLeft: 10,
  },
  dentistName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  dentistEmail: {
    fontSize: 14,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20, // Hacer la imagen circular
  },
});