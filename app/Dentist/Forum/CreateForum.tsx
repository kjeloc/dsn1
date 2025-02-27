import React, { useState, useEffect } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, StyleSheet, Alert, useColorScheme } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { db } from "../../../config/firebaseConfig";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { useLocalSearchParams, useRouter } from "expo-router";
import RNPickerSelect from "react-native-picker-select"; // Importamos react-native-picker-select
import dayjs from "dayjs";
import { Forum } from "../../utils/types";

const CreateForum: React.FC = () => {
  const { userId } = useLocalSearchParams();
  const router = useRouter();
  const { control, handleSubmit, reset } = useForm<Forum>();
  const [authorEmail, setAuthorEmail] = useState("");
  const colorScheme = useColorScheme(); // Detectar el esquema de color del dispositivo


  // Función para registrar logs
  const logAction = async (userId: string, action: string) => {
    try {
      await addDoc(collection(db, "logs"), {
        userId: userId,
        action: action,
        timestamp: new Date(), // Fecha y hora actual
      });
      console.log("Log registrado correctamente:", action);
    } catch (error) {
      console.error("Error al registrar el log:", error);
    }
  };


  useEffect(() => {
    const fetchDentistData = async () => {
      if (!userId) return;
      try {
        const userDoc = await getDoc(doc(db, "userTest", userId as string));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setAuthorEmail(data?.email || "");
        }
      } catch (error) {
        console.error("Error al obtener datos del dentista:", error);
      }
    };
    fetchDentistData();
  }, [userId]);

  const onSubmit = async (data: Forum) => {
    if (!userId) {
      Alert.alert("Error", "Usuario no identificado.");
      return;
    }
    try {
      await addDoc(collection(db, "forums"), {
        ...data,
        date: dayjs().format("YYYY-MM-DD"),
        author: authorEmail,
      });
      // Registrar log de creación de foro
      await logAction(userId as string, "Creación de foro");
      reset();
      Alert.alert("Publicación creada", "La publicación se ha guardado correctamente.");
      router.back();
    } catch (error) {
      console.error("Error al agregar la publicación:", error);
      Alert.alert("Error", "No se pudo guardar la publicación. Inténtalo de nuevo.");
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#121212' : '#F9F9F9' }]}>
      <Text style={[styles.title, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>Crear Nueva Publicación</Text>

      {/* Campo de título */}
      <Controller
        control={control}
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#FFF',
                borderColor: colorScheme === 'dark' ? '#444' : '#CCC',
                color: colorScheme === 'dark' ? '#fff' : '#000',
              },
            ]}
            placeholder="Título"
            placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#888'}
            onChangeText={onChange}
            value={value}
          />
        )}
        name="title"
        defaultValue=""
      />

      {/* Selector de tipo */}
      <Controller
        control={control}
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <RNPickerSelect
            onValueChange={onChange}
            items={[
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
                marginBottom: 15,
              },
              inputIOS: {
                backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#FFF',
                borderColor: colorScheme === 'dark' ? '#444' : '#CCC',
                color: colorScheme === 'dark' ? '#fff' : '#000',
                padding: 10,
                borderRadius: 8,
                marginBottom: 15,
              },
            }}
          />
        )}
        name="type"
        defaultValue=""
      />

      {/* Selector de categoría */}
      <Controller
        control={control}
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <RNPickerSelect
            onValueChange={onChange}
            items={[
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
                marginBottom: 15,
              },
              inputIOS: {
                backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#FFF',
                borderColor: colorScheme === 'dark' ? '#444' : '#CCC',
                color: colorScheme === 'dark' ? '#fff' : '#000',
                padding: 10,
                borderRadius: 8,
                marginBottom: 15,
              },
            }}
          />
        )}
        name="category"
        defaultValue=""
      />

      {/* Campo de contenido */}
      <Controller
        control={control}
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#FFF',
                borderColor: colorScheme === 'dark' ? '#444' : '#CCC',
                color: colorScheme === 'dark' ? '#fff' : '#000',
              },
            ]}
            placeholder="Contenido"
            placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#888'}
            multiline
            numberOfLines={5}
            onChangeText={onChange}
            value={value}
          />
        )}
        name="content"
        defaultValue=""
      />

      {/* Campo de autor (solo lectura) */}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#FFF',
            borderColor: colorScheme === 'dark' ? '#444' : '#CCC',
            color: colorScheme === 'dark' ? '#fff' : '#000',
          },
        ]}
        placeholder="Autor (Correo electrónico)"
        value={authorEmail}
        editable={false}
      />

      {/* Botón de envío */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colorScheme === 'dark' ? '#761FE0' : '#007BFF' }]}
        onPress={handleSubmit(onSubmit)}
      >
        <Text style={styles.buttonText}>Crear Publicación</Text>
      </TouchableOpacity>
    </ScrollView>
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
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CreateForum;