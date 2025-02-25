import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { fetchAssociatedDentists } from "../../utils/firebaseService";

const DentistListScreen: React.FC = () => {
  const [dentists, setDentists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();

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
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={dentists}
        keyExtractor={(item) => item.email}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.dentistCard}
            onPress={() => router.push(`./MapScreen?dentistEmail=${item.email}`)} // Navegar al mapa con el correo del odontólogo
          >
            <Text style={styles.dentistName}>{item.name}</Text>
            <Text style={styles.dentistEmail}>{item.email}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay odontólogos asociados.</Text>}
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
    backgroundColor: "#f9f9f9",
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  dentistName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  dentistEmail: {
    fontSize: 14,
    color: "#666",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#888",
  },
});