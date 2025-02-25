import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Pressable,
  useColorScheme,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { db } from "../../config/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useLocalSearchParams } from "expo-router";
import axios from "axios";
import * as ImageManipulator from "expo-image-manipulator";
import { Ionicons } from "@expo/vector-icons"; // Importando el ícono de lápiz
import { DentistData } from "../utils/types";
import { useAppTheme } from "../Constants/Colors"; 


const IMGUR_CLIENT_ID = "64c190c058b9f98";

const ProfileDentist: React.FC = () => {
   const theme = useAppTheme(); // Obtener el tema dinámico
  const { userId } = useLocalSearchParams();
  const [dentistData, setDentistData] = useState<DentistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [imageSelected, setImageSelected] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false); // Para mostrar el modal
  const colorScheme = useColorScheme(); // Detectar el esquema de color del dispositivo

  useEffect(() => {
    const fetchDentistData = async () => {
      if (!userId) return;
      try {
        const userDoc = await getDoc(doc(db, "userTest", userId as string));
        if (userDoc.exists()) {
          const data = userDoc.data() as DentistData;
          setDentistData(data);
          if (data.profilePicture) {
            setUploadedImageUrl(data.profilePicture);
          }
        }
      } catch (error) {
        console.error("Error al obtener los datos del dentista:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDentistData();
  }, [userId]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setImageSelected(true);
      setModalVisible(true); // Mostrar el modal cuando se seleccione una imagen
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setImageSelected(true);
      setModalVisible(true); // Mostrar el modal cuando se tome una foto
    }
  };

  const resizeImage = async (uri: string) => {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipResult.uri;
    } catch (error) {
      console.error("Error redimensionando la imagen:", error);
      return uri;
    }
  };

  const uploadToImgur = async () => {
    if (!selectedImage) {
      Alert.alert("Error", "Por favor selecciona una imagen primero");
      return;
    }

    setIsUploading(true);

    try {
      const resizedImageUri = await resizeImage(selectedImage);

      const formData = new FormData();
      formData.append("image", {
        uri: resizedImageUri,
        type: "image/jpeg",
        name: "profile.jpg",
      } as any);

      const response = await axios.post(
        "https://api.imgur.com/3/image",
        formData,
        {
          headers: {
            Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        const imageUrl = response.data.data.link;

        if (!userId) return;
        const userRef = doc(db, "userTest", userId as string);
        await updateDoc(userRef, {
          profilePicture: imageUrl,
        });

        setUploadedImageUrl(imageUrl);
        setDentistData((prev) =>
          prev ? { ...prev, profilePicture: imageUrl } : null
        );

        Alert.alert("Éxito", "Imagen subida y guardada correctamente");
        setModalVisible(false); // Cerrar el modal después de subir la imagen
      } else {
        Alert.alert("Error", "No se pudo subir la imagen");
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "Ocurrió un error durante el proceso");
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!dentistData) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ color: colorScheme === "dark" ? "#fff" : "#000" }}>
          No se encontraron datos del dentista.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollViewContainer,
        { backgroundColor: colorScheme === "dark" ? "#121212" : "#F9F9F9" },
      ]}
    >
      {/* Título */}
      <Text style={[styles.title, { color: colorScheme === "dark" ? "#fff" : "#000" }]}>
        Perfil del Dentista
      </Text>

       {/* Imagen de perfil */}
            <View style={styles.profileImageContainer}>
              <Image
                source={{ uri: uploadedImageUrl || dentistData.profilePicture }}
                style={styles.profileImage}
                resizeMode="cover"
              />
        {/* Botón de edición de imagen */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons
            name="pencil"
            size={24}
            color={colorScheme === "dark" ? "#fff" : "#000"}
          />
        </TouchableOpacity>
      </View>

      {/* Tarjetas con información */}
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { color: colorScheme === "dark" ? "#fff" : "#000" }]}>
            Nombre:
          </Text>
          <Text style={[styles.cardContent, { color: colorScheme === "dark" ? "#bbb" : "#555" }]}>
            {dentistData.name || "No especificado"}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardTitle, { color: colorScheme === "dark" ? "#fff" : "#000" }]}>
            Correo Electrónico:
          </Text>
          <Text style={[styles.cardContent, { color: colorScheme === "dark" ? "#bbb" : "#555" }]}>
            {dentistData.email || "No especificado"}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardTitle, { color: colorScheme === "dark" ? "#fff" : "#000" }]}>
            Fecha de Nacimiento:
          </Text>
          <Text style={[styles.cardContent, { color: colorScheme === "dark" ? "#bbb" : "#555" }]}>
            {dentistData.birthdate || "No especificado"}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardTitle, { color: colorScheme === "dark" ? "#fff" : "#000" }]}>
            Estado:
          </Text>
          <Text style={[styles.cardContent, { color: colorScheme === "dark" ? "#bbb" : "#555" }]}>
            {dentistData.state || "No especificado"}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardTitle, { color: colorScheme === "dark" ? "#fff" : "#000" }]}>
            Consultorios Asignados:
          </Text>
          {dentistData.dental_office.length > 0 ? (
            dentistData.dental_office.map((office, index) => (
              <Text
                key={index}
                style={[styles.cardContent, { color: colorScheme === "dark" ? "#bbb" : "#555" }]}
              >
                - {office}
              </Text>
            ))
          ) : (
            <Text style={[styles.cardContent, { color: colorScheme === "dark" ? "#bbb" : "#555" }]}>
              No hay consultorios asignados.
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardTitle, { color: colorScheme === "dark" ? "#fff" : "#000" }]}>
            Pacientes Asociados:
          </Text>
          {dentistData.patients.length > 0 ? (
            dentistData.patients.map((patient, index) => (
              <Text
                key={index}
                style={[styles.cardContent, { color: colorScheme === "dark" ? "#bbb" : "#555" }]}
              >
                - {patient}
              </Text>
            ))
          ) : (
            <Text style={[styles.cardContent, { color: colorScheme === "dark" ? "#bbb" : "#555" }]}>
              No hay pacientes asociados.
            </Text>
          )}
        </View>
      </View>

      {/* Modal con la previsualización y el botón de carga */}
           <Modal
             animationType="slide"
             transparent={true}
             visible={modalVisible}
             onRequestClose={() => setModalVisible(false)}
           >
             <View style={[styles.modalOverlay, { backgroundColor: theme.modalBackground }]}>
               <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
                 <Text style={[styles.modalTitle, { color: theme.text }]}>Previsualizar Imagen</Text>
                 <Image
                   source={{ uri: selectedImage || undefined }}
                   style={styles.modalImage}
                   resizeMode="contain"
                 />
                 <View style={styles.buttonsContainer}>
                   <TouchableOpacity
                     style={[styles.cameraButton, { backgroundColor: theme.button }]}
                     onPress={takePhoto}
                   >
                     <Text style={[styles.buttonText, { color: theme.text }]}>Tomar Foto</Text>
                   </TouchableOpacity>
                   <TouchableOpacity
                     style={[styles.cameraButton, { backgroundColor: theme.button }]}
                     onPress={pickImage}
                   >
                     <Text style={[styles.buttonText, { color: theme.text }]}>Escoger Foto</Text>
                   </TouchableOpacity>
                 </View>
                 <TouchableOpacity
                   style={[styles.uploadButton, { backgroundColor: theme.button }]}
                   onPress={uploadToImgur}
                   disabled={isUploading}
                 >
                   {isUploading ? (
                     <ActivityIndicator size="small" color="#fff" />
                   ) : (
                     <Text style={[styles.uploadButtonText, { color: theme.text }]}>Subir Imagen</Text>
                   )}
                 </TouchableOpacity>
                 <Pressable
                   style={styles.closeButton}
                   onPress={() => setModalVisible(false)}
                 >
                   <Text style={[styles.closeButtonText, { color: theme.text }]}>Cerrar</Text>
                 </Pressable>
               </View>
             </View>
           </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollViewContainer: {
    padding: 16,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 24,
    alignItems: "center",
  },
  profileImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 5,
  },
  editButton: {
    position: "absolute",
    bottom: 15,
    right: 80,
    left: 235,
    backgroundColor: "rgb(182, 105, 245)",
    borderRadius: 20,
    padding: 5,
  },
  cardContainer: {
    marginTop: 16,
    width: "100%",
  },
  card: {
    marginBottom: 10,
    padding: 12,
    borderRadius: 8,
    elevation: 1,
  },
  cardTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
  cardContent: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 8,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  modalImage: {
    width: "100%",
    height: 200,
    marginBottom: 16,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  cameraButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  uploadButton: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ProfileDentist;