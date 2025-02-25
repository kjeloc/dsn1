import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { UserChat,Chat } from "../utils/types";
import { fetchUserChats, createNewChat, fetchAvailableUsers, getUserEmailFromId} from "../utils/firebaseService";

const ChatListScreen: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserChat[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();

  // Validar que userId esté definido
  if (!userId) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Error: userId no está definido</Text>
      </View>
    );
  }

  // Cargar chats del usuario
  useEffect(() => {
    const loadChats = async () => {
      try {
        const userEmail = await getUserEmailFromId(userId); // Obtener el correo del usuario
        if (!userEmail) {
          throw new Error("No se pudo obtener el correo del usuario");
        }
        const chatsData = await fetchUserChats(userEmail);
        setChats(chatsData);
      } catch (error) {
        console.error("Error al cargar chats:", error);
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

  return (
    <View style={styles.container}>
      {/* Lista de Usuarios Disponibles */}
      <FlatList
        data={availableUsers}
        keyExtractor={(item) => item.email}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatItem}
            onPress={() => handleCreateChat(item.id || "", item.email)}
          >
            <Text style={styles.chatName}>{item.name}</Text>
            <Text style={styles.chatRole}>{item.rol}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay usuarios disponibles.</Text>
        }
      />

      {/* Lista de Chats */}
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const otherParticipantEmail = item.participantsEmail.find(
            (email) => email !== userId
          );
          return (
            <TouchableOpacity
              style={styles.chatItem}
              onPress={() =>
                router.push(`/Chat/ChatScreen?chatId=${item.id}&userId=${userId}`)
              }
            >
              <Text style={styles.chatName}>{otherParticipantEmail}</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay chats disponibles.</Text>
        }
      />
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  chatName: {
    fontWeight: "bold",
    fontSize: 16,
  },
  chatRole: {
    fontSize: 14,
    color: "#666",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginVertical: 20,
  },
});

export default ChatListScreen;