import React, { useEffect, useState } from "react";
import { FlatList, Text, View, TextInput, StyleSheet, TouchableOpacity,ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import { Forum } from "../../utils/types";
import { fetchForums } from "../../utils/firebaseService";

const ListaForos: React.FC = () => {
  const { userId } = useLocalSearchParams();
  const [foros, setForos] = useState<Forum[]>([]);
  const [filteredForos, setFilteredForos] = useState<Forum[]>([]);
  const [autorFilter, setAutorFilter] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadForos = async () => {
      try {
        const forumsData = await fetchForums();
        setForos(forumsData);
        setFilteredForos(forumsData);
      } catch (error) {
        console.error("Error al cargar los foros:", error);
      } finally {
        setLoading(false);
      }
    };

    loadForos();
  }, []);

  useEffect(() => {
    let filtered = foros;
    if (autorFilter) {
      filtered = filtered.filter(foro => foro.author.toLowerCase().includes(autorFilter.toLowerCase()));
    }
    if (categoriaFilter) {
      filtered = filtered.filter(foro => foro.category === categoriaFilter);
    }
    if (tipoFilter) {
      filtered = filtered.filter(foro => foro.type === tipoFilter);
    }
    setFilteredForos(filtered);
  }, [autorFilter, categoriaFilter, tipoFilter, foros]);

  const handleVerForo = (id: string) => {
    router.push({
      pathname: "./VistaForos",
      params: {
        userId: userId, // agrega el parámetro userId
        id: id          // agrega el parámetro id
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista de Foros</Text>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filterLabel}>Autor:</Text>
        <TextInput
          style={styles.filterInput}
          placeholder="Correo del autor"
          value={autorFilter}
          onChangeText={setAutorFilter}
        />

        <Text style={styles.filterLabel}>Categoría:</Text>
        <Picker
          style={styles.picker}
          selectedValue={categoriaFilter}
          onValueChange={setCategoriaFilter}
        >
          <Picker.Item label="Todos" value="" />
          <Picker.Item label="General" value="General" />
          <Picker.Item label="Ortodoncia" value="Ortodoncia" />
          <Picker.Item label="Endodoncia" value="Endodoncia" />
          <Picker.Item label="Periodoncia" value="Periodoncia" />
          <Picker.Item label="Estética" value="Estética" />
          <Picker.Item label="Prostodoncia" value="Prostodoncia" />
        </Picker>

        <Text style={styles.filterLabel}>Tipo:</Text>
        <Picker
          style={styles.picker}
          selectedValue={tipoFilter}
          onValueChange={setTipoFilter}
        >
          <Picker.Item label="Todos" value="" />
          <Picker.Item label="Anuncio" value="Anuncio" />
          <Picker.Item label="Consulta" value="Consulta" />
          <Picker.Item label="Misceláneo" value="Misceláneo" />
        </Picker>
      </View>

      {/* Lista de Foros */}
      <FlatList
        data={filteredForos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.foroItem}>
            <Text style={styles.foroTitle}>{item.title}</Text>
            <Text style={styles.foroInfo}>
              Autor: {item.author} | Categoría: {item.category} | Tipo: {item.type}
            </Text>
            <Text style={styles.foroDate}>Fecha: {item.date}</Text>
            <TouchableOpacity style={styles.verForoButton} onPress={() => handleVerForo(item.id)}>
              <Text style={styles.verForoButtonText}>Ver Foro</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F9F9F9",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: "#CCC",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#FFF",
  },
  picker: {
    height: 50,
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#FFF",
  },
  foroItem: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  foroTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  foroInfo: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
  },
  foroDate: {
    fontSize: 14,
    color: "#888",
    marginBottom: 10,
  },
  verForoButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  verForoButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ListaForos;