import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,} from "react-native";
import { db } from "../../config/firebaseConfig";
import {  collection, query, where, getDocs, doc, setDoc, getDoc,} from "firebase/firestore";
import { useRouter, useLocalSearchParams } from "expo-router";
import { UserChat,Chat } from "../utils/types";

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

  // Obtener el correo electrónico del usuario actual basado en su ID
  const getUserEmailFromId = async (userId: string): Promise<string | null> => {
    try {
      const userDoc = await getDoc(doc(db, "userTest", userId));
      if (!userDoc.exists()) {
        throw new Error(`El usuario ${userId} no existe`);
      }
      const userData = userDoc.data() as UserChat;
      return userData.email || null; // Devolver el correo electrónico del usuario
    } catch (error) {
      console.error("Error al obtener el correo del usuario:", error);
      return null;
    }
  };

  // Cargar chats del usuario
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const userEmail = await getUserEmailFromId(userId); // Obtener el correo del usuario
        if (!userEmail) {
          throw new Error("No se pudo obtener el correo del usuario");
        }

        const q = query(
          collection(db, "chats"),
          where("participantsEmail", "array-contains", userEmail)
        );
        const querySnapshot = await getDocs(q);

        const chatsData: Chat[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Chat[];

        setChats(chatsData);
      } catch (error) {
        if (error instanceof Error) {
          console.error("Error al cargar chats:", error.message);
        } else {
          console.error("Error desconocido al cargar chats:", error);
        }
      }
    };

    fetchChats();
  }, [userId]);

  // Cargar usuarios disponibles para chatear
  useEffect(() => {
    const fetchAvailableUsers = async () => {
      try {
        const userEmail = await getUserEmailFromId(userId); // Obtener el correo del usuario
        if (!userEmail) {
          throw new Error("No se pudo obtener el correo del usuario");
        }

        const userDoc = await getDoc(doc(db, "userTest", userId));

        if (!userDoc.exists()) {
          throw new Error(`El usuario ${userId} no existe`);
        }

        const userData = userDoc.data() as UserChat;

        let availableUsers: UserChat[] = [];

        if (userData.rol === "Dentist") {
          // Odontólogos pueden chatear con otros odontólogos y sus pacientes asignados
          const allUsersQuery = query(collection(db, "userTest"));
          const allUsersSnapshot = await getDocs(allUsersQuery);

          availableUsers = allUsersSnapshot.docs
            .filter((doc) => {
              const data = doc.data();
              return data.email && data.email !== userEmail; // Excluir al usuario actual
            })
            .map((doc) => {
              const data = doc.data();
              return {
                email: data.email,
                name: data.name,
                rol: data.rol,
                patients: data.patients || [],
                dentist: data.dentist || undefined,
                id: doc.id, // Obtener el ID del documento correctamente
                profilePicture: data.profilePicture || undefined,
                state: data.state || undefined,
              } as UserChat;
            })
            .filter((UserChat) => {
              // Mostrar otros odontólogos y pacientes asignados
              return (
                UserChat.rol === "Dentist" || // Otros odontólogos
                (userData.patients && userData.patients.includes(UserChat.email)) // Pacientes asignados
              );
            });
        } else if (userData.rol === "Patient") {
          // Pacientes solo pueden chatear con su odontólogo asignado
          const dentistEmail = userData.dentist;
          if (dentistEmail) {
            const dentistDoc = await getDoc(doc(db, "userTest", dentistEmail));
            if (dentistDoc.exists()) {
              const data = dentistDoc.data();
              availableUsers.push({
                email: data.email,
                name: data.name,
                rol: data.rol,
                patients: data.patients || [],
                dentist: data.dentist || undefined,
                id: dentistDoc.id, // Obtener el ID del documento correctamente
                profilePicture: data.profilePicture || undefined,
                state: data.state || undefined,
              } as UserChat);
            }
          }
        }

        console.log("Usuarios disponibles:", availableUsers); // Depuración
        setAvailableUsers(availableUsers);
      } catch (error) {
        if (error instanceof Error) {
          console.error("Error al cargar usuarios disponibles:", error.message);
        } else {
          console.error("Error desconocido al cargar usuarios disponibles:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableUsers();
  }, [userId]);

  // Crear un nuevo chat
  const createChat = async (participant1Id: string, participant2Id: string, participant1Email: string, participant2Email: string) => {
    try {
      console.log("Creando chat entre:", participant1Email, participant2Email); // Depuración

      // Ordenar los correos electrónicos para evitar problemas de consulta
      const sortedParticipantsEmail = [participant1Email, participant2Email].sort();

      // Verificar si ya existe un chat entre los dos participantes
      const q = query(
        collection(db, "chats"),
        where("participantsEmail", "==", sortedParticipantsEmail)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Si ya existe un chat, navegar directamente a él
        const existingChat = querySnapshot.docs[0];
        router.push(`/Chat/ChatScreen?chatId=${existingChat.id}&userId=${participant1Id}`);
        return;
      }

      // Si no existe un chat, crear uno nuevo
      const chatId = doc(collection(db, "chats")).id;

      await setDoc(doc(db, "chats", chatId), {
        participants: [participant1Id, participant2Id], // IDs de los documentos
        participantsEmail: sortedParticipantsEmail, // Correos electrónicos ordenados
      });

      setChats((prev) => [
        ...prev,
        {
          id: chatId,
          participants: [participant1Id, participant2Id],
          participantsEmail: sortedParticipantsEmail,
        },
      ]);

      // Navegar al chat recién creado
      router.push(`/Chat/ChatScreen?chatId=${chatId}&userId=${participant1Id}`);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error al crear chat:", error.message);
      } else {
        console.error("Error desconocido al crear chat:", error);
      }
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
        renderItem={({ item }) => {
          const userEmail = item.email; // Usar el correo electrónico como clave
          return (
            <TouchableOpacity
              style={styles.chatItem}
              onPress={async () => {
                const currentUserEmail = await getUserEmailFromId(userId); // Obtener el correo del usuario actual
                if (currentUserEmail) {
                  createChat(userId, item.id || "", currentUserEmail, userEmail);
                }
              }}
            >
              <Text style={styles.chatName}>{item.name}</Text>
              <Text style={styles.chatRole}>{item.rol}</Text>
            </TouchableOpacity>
          );
        }}
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