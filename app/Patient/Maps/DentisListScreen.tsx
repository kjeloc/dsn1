import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, useColorScheme, Image, } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { fetchAssociatedDentists } from "../../utils/firebaseService";
import { Ionicons } from "@expo/vector-icons"; // Para íconos
const DentistListScreen: React.FC = () => {
  const [dentists, setDentists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme(); // Detectar el esquema de color (light/dark)

  // Colores dinámicos para el modo claro/oscuro
  const backgroundColor = colorScheme === "dark" ? "#121212" : "#fff";
  const cardBackgroundColor = colorScheme === "dark" ? "#1e1e1e" : "#f9f9f9";
  const textColor = colorScheme === "dark" ? "#fff" : "#000";
  const secondaryTextColor = colorScheme === "dark" ? "#ccc" : "#666";
  const borderColor = colorScheme === "dark" ? "#333" : "#ddd";

  // Cargar los odontólogos asociados al paciente
  useEffect(() => {
    const loadAssociatedDentists = async () => {
      if (!userId) return;

      try {
        const associatedDentists = await fetchAssociatedDentists(userId);
        setDentists(associatedDentists);
      } catch (error) {
        if (error instanceof Error) {
          Alert.alert("Error", error.message); // Mostrar un mensaje de error al usuario
        } else {
          Alert.alert("Error", "Ocurrió un error desconocido"); // Mensaje genérico para errores desconocidos
        }
      } finally {
        setLoading(false);
      }
    };

    loadAssociatedDentists();
  }, [userId]);

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
};

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