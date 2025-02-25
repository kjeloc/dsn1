import React, { useEffect, useState } from "react";
import { FlatList, Text, View, TextInput, StyleSheet, TouchableOpacity, useColorScheme } from "react-native";
import { db } from "../../../config/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { useLocalSearchParams, useRouter } from "expo-router";
import RNPickerSelect from "react-native-picker-select"; // Importamos react-native-picker-select
import { Forum } from "../../utils/types";

const ListaForos: React.FC = () => {
  const { userId } = useLocalSearchParams();
  const [foros, setForos] = useState<Forum[]>([]);
  const [filteredForos, setFilteredForos] = useState<Forum[]>([]);
  const [autorFilter, setAutorFilter] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");
  const router = useRouter();
  const colorScheme = useColorScheme(); // Detectar el esquema de color del dispositivo

  useEffect(() => {
    const fetchForos = async () => {
      try {
        const q = collection(db, "forums");
        const querySnapshot = await getDocs(q);
        const forosData: Forum[] = [];
        querySnapshot.forEach((doc) => {
          forosData.push({ id: doc.id, ...doc.data() } as Forum);
        });
        setForos(forosData);
        setFilteredForos(forosData);
      } catch (error) {
        console.error("Error al obtener foros:", error);
      }
    };
    fetchForos();
  }, []);

  useEffect(() => {
    let filtered = foros;

    // Filtrar por autor
    if (autorFilter) {
      filtered = filtered.filter(
        (foro) =>
          foro.author && // Asegurarse de que `foro.author` no sea undefined
          foro.author.toLowerCase().includes(autorFilter.toLowerCase())
      );
    }

    // Filtrar por categoría
    if (categoriaFilter) {
      filtered = filtered.filter((foro) => foro.category === categoriaFilter);
    }

    // Filtrar por tipo
    if (tipoFilter) {
      filtered = filtered.filter((foro) => foro.type === tipoFilter);
    }

    setFilteredForos(filtered);
  }, [autorFilter, categoriaFilter, tipoFilter, foros]);

  const handleVerForo = (id: string) => {
    router.push({
      pathname: "/Dentist/Forum/VistaForos",
      params: {
        userId: userId, // agrega el parámetro userId
        id: id, // agrega el parámetro id
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#121212' : '#F9F9F9' }]}>
      <Text style={[styles.title, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>Lista de Foros</Text>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <Text style={[styles.filterLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>Autor:</Text>
        <TextInput
          style={[
            styles.filterInput,
            {
              backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#FFF',
              borderColor: colorScheme === 'dark' ? '#444' : '#CCC',
              color: colorScheme === 'dark' ? '#fff' : '#000',
            },
          ]}
          placeholder="Correo del autor"
          placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#888'}
          value={autorFilter}
          onChangeText={setAutorFilter}
        />

        <Text style={[styles.filterLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>Categoría:</Text>
        <RNPickerSelect
          onValueChange={(value) => setCategoriaFilter(value)}
          items={[
            { label: "Todos", value: "" },
            { label: "General", value: "General" },
            { label: "Ortodoncia", value: "Ortodoncia" },
            { label: "Endodoncia", value: "Endodoncia" },
            { label: "Periodoncia", value: "Periodoncia" },
            { label: "Estética", value: "Estética" },
            { label: "Prostodoncia", value: "Prostodoncia" },
          ]}
          placeholder={{ label: "Selecciona una categoría", value: null }}
          style={{
            inputAndroid: {
              backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#FFF',
              borderColor: colorScheme === 'dark' ? '#444' : '#CCC',
              color: colorScheme === 'dark' ? '#fff' : '#000',
              padding: 10,
              borderRadius: 8,
              marginBottom: 10,
            },
            inputIOS: {
              backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#FFF',
              borderColor: colorScheme === 'dark' ? '#444' : '#CCC',
              color: colorScheme === 'dark' ? '#fff' : '#000',
              padding: 10,
              borderRadius: 8,
              marginBottom: 10,
            },
          }}
        />

        <Text style={[styles.filterLabel, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>Tipo:</Text>
        <RNPickerSelect
          onValueChange={(value) => setTipoFilter(value)}
          items={[
            { label: "Todos", value: "" },
            { label: "Anuncio", value: "Anuncio" },
            { label: "Consulta", value: "Consulta" },
            { label: "Misceláneo", value: "Misceláneo" },
          ]}
          placeholder={{ label: "Selecciona un tipo", value: null }}
          style={{
            inputAndroid: {
              backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#FFF',
              borderColor: colorScheme === 'dark' ? '#444' : '#CCC',
              color: colorScheme === 'dark' ? '#fff' : '#000',
              padding: 10,
              borderRadius: 8,
              marginBottom: 10,
            },
            inputIOS: {
              backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#FFF',
              borderColor: colorScheme === 'dark' ? '#444' : '#CCC',
              color: colorScheme === 'dark' ? '#fff' : '#000',
              padding: 10,
              borderRadius: 8,
              marginBottom: 10,
            },
          }}
        />
      </View>

      {/* Lista de Foros */}
      <FlatList
        data={filteredForos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.foroItem,
              {
                backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#FFF',
                shadowColor: colorScheme === 'dark' ? '#000' : '#ccc',
              },
            ]}
          >
            <Text style={[styles.foroTitle, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
              {item.title}
            </Text>
            <Text style={[styles.foroInfo, { color: colorScheme === 'dark' ? '#bbb' : '#555' }]}>
              Autor: {item.author || "Desconocido"} | Categoría: {item.category} | Tipo: {item.type}
            </Text>
            <Text style={[styles.foroDate, { color: colorScheme === 'dark' ? '#aaa' : '#888' }]}>
              Fecha: {item.date}
            </Text>
            <TouchableOpacity
              style={[
                styles.verForoButton,
                { backgroundColor: colorScheme === 'dark' ? '#761FE0' : '#007BFF' },
              ]}
              onPress={() => handleVerForo(item.id)}
            >
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
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  picker: {
    height: 50,
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    marginBottom: 10,
  },
  foroItem: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
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
    marginBottom: 5,
  },
  foroDate: {
    fontSize: 14,
    marginBottom: 10,
  },
  verForoButton: {
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