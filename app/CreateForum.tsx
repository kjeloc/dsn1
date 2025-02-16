import React, { useState, useEffect } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { db } from "../config/firebaseConfig";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import dayjs from "dayjs";

interface ForumData {
  title: string;
  type: string;
  category: string;
  content: string;
  author: string;
  date: string;
}

const CreateForum: React.FC = () => {
  const { userId } = useLocalSearchParams();
  const router = useRouter();
  const { control, handleSubmit, reset } = useForm<ForumData>();
  const [authorEmail, setAuthorEmail] = useState("");

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

  const onSubmit = async (data: ForumData) => {
    console.log("esto es "+ userId);
    if (!userId) {
      Alert.alert("Error", "Usuario no identificado. "+ userId);
      return;
    }
    try {
      await addDoc(collection(db, "forums"), {
        ...data,
        date: dayjs().format("YYYY-MM-DD"),
        author: authorEmail,
      });
      reset();
      Alert.alert("Publicación creada", "La publicación se ha guardado correctamente.");
      router.back();
    } catch (error) {
      console.error("Error al agregar la publicación:", error);
      Alert.alert("Error", "No se pudo guardar la publicación. Inténtalo de nuevo.");
    }
  };

  return (
    <ScrollView>
      <Text style={styles.title}>Crear Nueva Publicación</Text>
      <Controller
        control={control}
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Título"
            onChangeText={onChange}
            value={value}
          />
        )}
        name="title"
        defaultValue=""
      />
      <Controller
        control={control}
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <Picker
            selectedValue={value}
            onValueChange={onChange}
            style={styles.input}
          >
            <Picker.Item label="Selecciona un tipo" value="" />
            <Picker.Item label="Anuncio" value="Anuncio" />
            <Picker.Item label="Consulta" value="Consulta" />
            <Picker.Item label="Misceláneo" value="Misceláneo" />
          </Picker>
        )}
        name="type"
        defaultValue=""
      />
      <Controller
        control={control}
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <Picker
            selectedValue={value}
            onValueChange={onChange}
            style={styles.input}
          >
            <Picker.Item label="Selecciona una categoría" value="" />
            <Picker.Item label="General" value="General" />
            <Picker.Item label="Ortodoncia" value="Ortodoncia" />
            <Picker.Item label="Endodoncia" value="Endodoncia" />
            <Picker.Item label="Periodoncia" value="Periodoncia" />
            <Picker.Item label="Estética" value="Estética" />
            <Picker.Item label="Prostodoncia" value="Prostodoncia" />
          </Picker>
        )}
        name="category"
        defaultValue=""
      />
      <Controller
        control={control}
        rules={{ required: true }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Contenido"
            multiline
            numberOfLines={5}
            onChangeText={onChange}
            value={value}
          />
        )}
        name="content"
        defaultValue=""
      />
      <TextInput
        style={styles.input}
        placeholder="Autor (Correo electrónico)"
        value={authorEmail}
        editable={false}
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)}>
        <Text style={styles.buttonText}>Crear Publicación</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F9F9F9",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#FFF",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#007BFF",
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