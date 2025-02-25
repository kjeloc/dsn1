import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image, Alert, Modal, Pressable,} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons"; // Importando el ícono de lápiz
import { DentistData } from "../utils/types";
import { fetchDentistDatas,  updateDentistProfilePicture, uploadImageToImgur,} from "../utils/firebaseService";

const ProfileDentist: React.FC = () => {
  const { userId } = useLocalSearchParams();
  const [dentistData, setDentistData] = useState<DentistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const loadDentistData = async () => {
      if (!userId) return;
      try {
        const data = await fetchDentistDatas(userId as string);
        setDentistData(data);
        if (data?.profilePicture) {
          setUploadedImageUrl(data.profilePicture);
        }
      } catch (error) {
        console.error("Error al cargar los datos del dentista:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDentistData();
  }, [userId]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setModalVisible(true);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setModalVisible(true);
    }
  };

  const handleUploadImage = async () => {
    if (!selectedImage || !userId) {
      Alert.alert("Error", "Por favor selecciona una imagen primero");
      return;
    }

    setIsUploading(true);

    try {
      const imageUrl = await uploadImageToImgur(selectedImage);
      await updateDentistProfilePicture(userId as string, imageUrl);

      setUploadedImageUrl(imageUrl);
      setDentistData((prev) =>
        prev ? { ...prev, profilePicture: imageUrl } : null
      );

      Alert.alert("Éxito", "Imagen subida y guardada correctamente");
      setModalVisible(false);
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
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  if (!dentistData) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No se encontraron datos del dentista.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContainer}>
      <Text style={styles.title}>Perfil del Dentista</Text>

      {/* Imagen de perfil */}
      <View style={styles.profileImageContainer}>
        <Image
          source={{ uri: uploadedImageUrl || dentistData.profilePicture }}
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

      {/* Tarjetas con la información */}
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nombre:</Text>
          <Text style={styles.cardContent}>{dentistData.name}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Correo Electrónico:</Text>
          <Text style={styles.cardContent}>{dentistData.email}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fecha de Nacimiento:</Text>
          <Text style={styles.cardContent}>{dentistData.birthdate}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Estado:</Text>
          <Text style={styles.cardContent}>{dentistData.state}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Consultorios Asignados:</Text>
          {dentistData.dental_office.length > 0 ? (
            dentistData.dental_office.map((office, index) => (
              <Text key={index} style={styles.cardContent}>
                - {office}
              </Text>
            ))
          ) : (
            <Text style={styles.cardContent}>
              No hay consultorios asignados.
            </Text>
          )}
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pacientes Asociados:</Text>
          {dentistData.patients.length > 0 ? (
            dentistData.patients.map((patient, index) => (
              <Text key={index} style={styles.cardContent}>
                - {patient}
              </Text>
            ))
          ) : (
            <Text style={styles.cardContent}>No hay pacientes asociados.</Text>
          )}
        </View>
      </View>

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Previsualizar Imagen</Text>
            <Image
              source={{ uri: selectedImage || undefined }}
              style={styles.modalImage}
              resizeMode="contain"
            />
            <View style={styles.buttonsContainer}>
              <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
                <Text style={styles.buttonText}>Tomar Foto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                <Text style={styles.buttonText}>Escoger Foto</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleUploadImage}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.uploadButtonText}>Subir Imagen</Text>
              )}
            </TouchableOpacity>
            <Pressable
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
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
    alignItems: "center",
    justifyContent: "center",
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
    borderColor: "#007BFF",
  },
  editButton: {
    position: "absolute",
    bottom: 15,
    right: 80,
    left: 235,
    backgroundColor: "rgba(14, 14, 14, 0.99)",
    borderRadius: 20,
    padding: 5,
  },
  cardContainer: {
    marginTop: 16,
  },
  card: {
    marginBottom: 10,
    padding: 12,
    backgroundColor: "#f7f7f7",
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
    color: "#555",
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
  uploadButton: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 5,
    marginBottom: -6,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
  },
  closeButtonText: {
    fontSize: 16,
    color: "#007BFF",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  cameraButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    flex: 1,
    alignItems: "center",
    marginRight: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default ProfileDentist;
