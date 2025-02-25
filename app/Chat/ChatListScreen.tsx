import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  Modal,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Iconos
import { db } from "../../config/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  getDoc,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import dayjs from "dayjs"; // Para formatear fechas
import relativeTime from "dayjs/plugin/relativeTime"; // Para tiempos relativos ("hace 5 minutos")
import { useRouter, useLocalSearchParams } from "expo-router";

// Configurar dayjs para tiempos relativos
dayjs.extend(relativeTime);

interface User {
  name: string;
  rol: "Dentist" | "Patient";
  patients?: string[];
  dentist?: string;
  email: string;
  id?: string; // Hacer el campo opcional para evitar errores
  profilePicture?: string;
  state?: string;
}

interface Chat {
  id: string;
  participants: string[]; // IDs de los usuarios participantes
  participantsEmail: string[]; // Correos electrónicos de los participantes
  lastMessage?: string; // Último mensaje (opcional)
  lastMessageTimestamp?: any; // Marca de tiempo del último mensaje (opcional)
  lastMessageSenderId?: string; // ID del remitente del último mensaje (opcional)
  otherParticipantName?: string; // Nombre del otro participante (opcional)
  lastMessageTime?: string; // Tiempo del último mensaje (opcional)
  profilePicture?: string;
}

interface Message {
  senderId: string; // ID del remitente
  text: string;
  timestamp: any; // Puede ser un objeto Timestamp de Firestore
}
import { fetchUserChats, createNewChat, fetchAvailableUsers, getUserEmailFromId} from "../utils/firebaseService";

const ChatListScreen: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false); // Controlar el modal
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const colorScheme = useColorScheme(); // Detectar el esquema de color

  // Validar que userId esté definido
  if (!userId) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Error: userId no está definido</Text>
      </View>
    );
  }

  // Obtener los datos del usuario actual basado en su ID
  const getUserDataFromId = async (userId: string): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, "userTest", userId));
      if (!userDoc.exists()) {
        throw new Error(`El usuario ${userId} no existe`);
      }
      return userDoc.data() as User;
    } catch (error) {
      console.error("Error al obtener los datos del usuario:", error);
      return null;
    }
  };

  // Cargar chats del usuario con actualización en tiempo real
  useEffect(() => {
    const loadChats = async () => {
      try {
        const userData = await getUserDataFromId(userId);
        const userEmail = userData?.email;
        if (!userEmail) {
          throw new Error("No se pudo obtener el correo del usuario");
        }
        const chatsData = await fetchUserChats(userEmail);
        setChats(chatsData);
      } catch (error) {
        console.error("Error al cargar chats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadChats();
  }, [userId]);

  // Cargar usuarios disponibles para chatear
  useEffect(() => {
    const loadAvailableUsers = async () => {
      try {
        const userEmail = await getUserEmailFromId(userId); // Obtener el correo del usuario
        if (!userEmail) {
          throw new Error("No se pudo obtener el correo del usuario");
        }
        const usersData = await fetchAvailableUsers(userId, userEmail);
        setAvailableUsers(usersData);
      } catch (error) {
        console.error("Error al cargar usuarios disponibles:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAvailableUsers();
  }, [userId]);

  // Crear un nuevo chat
  const handleCreateChat = async (participant2Id: string, participant2Email: string) => {
    try {
      const currentUserEmail = await getUserEmailFromId(userId); // Obtener el correo del usuario actual
      if (!currentUserEmail) {
        throw new Error("No se pudo obtener el correo del usuario actual");
      }

      const chatId = await createNewChat(userId, participant2Id, currentUserEmail, participant2Email);

      if (chatId) {
        setChats((prev) => [
          ...prev,
          {
            id: chatId,
            participants: [userId, participant2Id],
            participantsEmail: [currentUserEmail, participant2Email].sort(),
          },
        ]);
        router.push(`/Chat/ChatScreen?chatId=${chatId}&userId=${userId}`);
      }
    } catch (error) {
      console.error("Error al crear chat:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  // Estilos dinámicos para dark mode
  const backgroundColor = colorScheme === "dark" ? "#121212" : "#fff";
  const textColor = colorScheme === "dark" ? "#fff" : "#000";

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Lista de Chats */}
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSent = item.lastMessageSenderId === userId;
          const messagePrefix = isSent ? "Enviado: " : "Recibido: ";
          return (
            <TouchableOpacity
              style={[
                styles.chatItem,
                { backgroundColor: colorScheme === "dark" ? "#1e1e1e" : "#f5f5f5" },
              ]}
              onPress={() =>
                router.push(`/Chat/ChatScreen?chatId=${item.id}&userId=${userId}`)
              }
            >
                             {/* Foto de Perfil */}
        <View style={styles.profilePictureContainer}>
          {item.profilePicture ? (
            <Image
              source={{ uri: item.profilePicture }}
              style={styles.profilePicture}
            />
          ) : (
            <Ionicons name="person-circle-outline" size={40} color="#ccc" />
          )}
        </View>
              <View style={styles.chatContent}>
                <Text style={[styles.chatName, { color: textColor }]}>
                  {item.otherParticipantName}
                </Text>
                <Text style={[styles.lastMessage, { color: textColor }]}>
                  {item.lastMessage
                    ? `${messagePrefix}${item.lastMessage}`
                    : "Sin mensajes"}
                </Text>
              </View>
              <Text style={[styles.lastMessageTime, { color: textColor }]}>
                {item.lastMessageTime}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: textColor }]}>
            No hay chats disponibles.
          </Text>
        }
      />

      {/* Botón Flotante para Nuevo Chat */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsModalVisible(true)}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

     {/* Modal para Usuarios Disponibles */}
<Modal visible={isModalVisible} animationType="slide" transparent>
  <View style={styles.modalContainer}>
    <View style={[styles.modalContent, { backgroundColor }]}>
      {/* Título del Modal */}
      <Text style={[styles.modalTitle, { color: textColor }]}>
        Selecciona un usuario
      </Text>

      {/* Lista de Usuarios Disponibles */}
      <FlatList
        data={availableUsers}
        keyExtractor={(item) => item.id || item.email}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.userItemContainer,
              { backgroundColor: colorScheme === "dark" ? "#1e1e1e" : "#fff" },
            ]}
            onPress={async () => {
              const currentUser = await getUserDataFromId(userId);
              const currentUserEmail = currentUser?.email;
              if (currentUserEmail) {
                createChat(userId, item.id || "", currentUserEmail, item.email);
                setIsModalVisible(false); // Cerrar el modal
              }
            }}
          >
            {/* Foto de Perfil */}
            <View style={styles.profilePictureContainer}>
              {item.profilePicture ? (
                <Image
                  source={{ uri: item.profilePicture }}
                  style={styles.profilePicture}
                />
              ) : (
                <Ionicons name="person-circle-outline" size={40} color="#ccc" />
              )}
            </View>

            {/* Información del Usuario */}
            <View style={styles.userInfoContainer}>
              <Text style={[styles.userName, { color: textColor }]}>{item.name}</Text>
              <Text style={[styles.userRole, { color: textColor }]}>{item.rol}</Text>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => (
          <View
            style={{
              height: 1,
              backgroundColor: colorScheme === "dark" ? "#333" : "#ccc",
            }}
          />
        )}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: textColor }]}>
            No hay usuarios disponibles.
          </Text>
        }
      />

      {/* Botón de Cierre */}
      <TouchableOpacity
        style={[
          styles.closeButton,
          { backgroundColor: colorScheme === "dark" ? "#333" : "#007BFF" },
        ]}
        onPress={() => setIsModalVisible(false)}
      >
        <Text style={[styles.closeButtonText, { color: textColor }]}>Cerrar</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  chatItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  chatContent: {
    flex: 1,
  },
  chatName: {
    fontWeight: "bold",
    fontSize: 16,
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  chatRole: {
    fontSize: 14,
    color: "#666",
  },
  lastMessageTime: {
    fontSize: 12,
    color: "#999",
    marginLeft: 10,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    marginVertical: 20,
  },
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007BFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Fondo semi-transparente
  },
  modalContent: {
    width: "90%",
    maxHeight: "800%", // Limitar la altura máxima
    padding: 20,
    borderRadius: 15, // Bordes redondeados
    alignItems: "center",
    shadowColor: "#000", // Sombra para iOS
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10, // Elevación para Android
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  userItemContainer: {
    flex:1,
    flexDirection: "row", // Alinear foto e información horizontalmente
    alignItems: "center", // Centrar verticalmente
    paddingVertical: 5, // Espaciado vertical
    paddingHorizontal: 10, // Espaciado horizontal
    borderRadius: 8, // Bordes redondeados
    maxHeight: 75, // Altura máxima de la fila
    width: 140,
  },
  profilePictureContainer: {
    marginRight: 12, // Espacio entre la foto y el texto
  },
  profilePicture: {
    width: 50, // Tamaño de la foto de perfil
    height: 50,
    borderRadius: 25, // Hacer la imagen circular
  },
  userInfoContainer: {
    flex: 1, // Ocupar el espacio restante
    justifyContent: "center", // Centrar
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  userRole: {
    fontSize: 14,
    color: "#666", // Color secundario para el rol
  },
  closeButton: {
    marginTop: 20,
    padding: 12,
    borderRadius: 8, // Bordes redondeados
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default ChatListScreen;