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
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { PatientData } from "../utils/types";
import axios from "axios";
import { useAppTheme } from "../Constants/Colors"; // Importar los colores dinámicos
import { fetchPatientData, updatePatientProfilePicture, uploadImageToImgur, } from "../utils/firebaseService";

const ProfilePatient: React.FC = () => {
  const theme = useAppTheme(); // Obtener el tema dinámico
  const { userId } = useLocalSearchParams();
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [imageSelected, setImageSelected] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const loadPatientData = async () => {
      if (!userId) return;
      try {
        const data = await fetchPatientData(userId as string);
        setPatientData(data as PatientData);
      } catch (error) {
        console.error("Error al cargar los datos del paciente:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPatientData();
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

  const handleUploadImage = async () => {
    if (!selectedImage || !userId) {
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
        setPatientData((prev) =>
          prev ? { ...prev, profilePicture: imageUrl } : null
        );
        Alert.alert("Éxito", "Imagen subida y guardada correctamente");
        setModalVisible(false);
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
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!patientData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>No se encontraron datos del paciente.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.scrollViewContainer, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Perfil del Paciente</Text>


      {/* Imagen de perfil */}
      <View style={styles.profileImageContainer}>
        <Image
          source={{ uri: uploadedImageUrl || patientData.profilePicture }}
          style={styles.profileImage}
          resizeMode="cover"
        />
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="pencil-outline" size={25} color="white" />
        </TouchableOpacity>
      </View>

      {/* Nombre */}
      <View style={[styles.infoSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.label, { color: theme.secondary }]}>Nombre:</Text>
        <Text style={[styles.value, { color: theme.text }]}>{patientData.name}</Text>
      </View>

      {/* Correo Electrónico */}
      <View style={[styles.infoSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.label, { color: theme.secondary }]}>Correo Electrónico:</Text>
        <Text style={[styles.value, { color: theme.text }]}>{patientData.email}</Text>
      </View>

      {/* Fecha de Nacimiento */}
      <View style={[styles.infoSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.label, { color: theme.secondary }]}>Fecha de Nacimiento:</Text>
        <Text style={[styles.value, { color: theme.text }]}>{patientData.birthdate}</Text>
      </View>

      {/* Edad */}
      <View style={[styles.infoSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.label, { color: theme.secondary }]}>Edad:</Text>
        <Text style={[styles.value, { color: theme.text }]}>{patientData.age || "No especificada"}</Text>
      </View>

      {/* Citas Programadas */}
      <View style={[styles.infoSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.label, { color: theme.secondary }]}>Citas Programadas:</Text>
        {patientData?.appointments?.length > 0 ? (
          patientData.appointments.map((appointment, index) => (
            <Text key={index} style={[styles.value, { color: theme.text }]}>
              - {appointment.date} ({appointment.reason})
            </Text>
          ))
        ) : (
          <Text style={[styles.value, { color: theme.text }]}>No hay citas programadas.</Text>
        )}
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
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollViewContainer: {
    padding: 16,
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
    borderColor: "#007BFF",
  },
  editButton: {
    position: "absolute",
    bottom: 15,
    right: 80,
    left: 235,
    backgroundColor: "rgb(2, 175, 255)",
    borderRadius: 20,
    padding: 5,
  },
  label: {
    fontSize: 18,
    fontWeight: "500", // Menos énfasis
    color: "#666",  // Colores más suaves
    marginBottom: 8,
  },
  value: {
    fontSize: 18,
    color: "#333",
    fontWeight: "400",  // Un poco más de ligereza en el texto
    marginBottom: 12, // Mayor separación entre elementos
  },
  infoSection: {
    marginBottom: 20,
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5, // Sombra suave para el efecto de profundidad
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",  // Fondo oscuro más suave
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 12,
    width: "85%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 10, // Más profundidad para el modal
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333",
  },
  modalImage: {
    width: "100%",
    height: 200,
    marginBottom: 16,
    borderRadius: 8,
  },
  uploadButton: {
    backgroundColor: "#28a745", // Un verde suave para el botón de subir
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: "100%",
    alignItems: "center",
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
  },
  closeButton: {
    marginTop: 12,
    padding: 10,
    backgroundColor: "#007BFF",  // Color más sutil para el botón de cerrar
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "500",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  cameraButton: {
    backgroundColor: "#00AEEF", // Un azul suave para los botones
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    flex: 1,
    alignItems: "center",
    marginRight: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ProfilePatient;