import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView,} from "react-native";
import { db } from "../../config/firebaseConfig";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp, updateDoc, doc } from "firebase/firestore";
import { useLocalSearchParams } from "expo-router";
import { Message } from "../utils/types";

const ChatScreen: React.FC = () => {
  const { chatId, userId } = useLocalSearchParams<{ chatId: string; userId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Cargar mensajes del chat en tiempo real
  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messagesData: Message[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp;

        // Convertir Timestamp a Date si es necesario
        const convertedTimestamp =
          timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;

        return {
          id: doc.id,
          ...data,
          timestamp: convertedTimestamp, // Usar la fecha convertida
        };
      }) as Message[];

      setMessages(messagesData);
    });

    return () => unsubscribe(); // Limpiar el listener al desmontar el componente
  }, [chatId]);

  // Enviar un nuevo mensaje
// Enviar un nuevo mensaje
const sendMessage = async () => {
  if (!newMessage.trim()) return;

  try {
    const messagesRef = collection(db, "chats", chatId, "messages");
    const newMessageData = {
      text: newMessage,
      senderId: userId,
      // senderEmail: userEmail, // Usa el correo electrónico si lo prefieres
      timestamp: serverTimestamp(), // Usar serverTimestamp para sincronización
    };

    // Guardar el mensaje en la subcolección "messages"
    await addDoc(messagesRef, newMessageData);

    // Actualizar el documento del chat con el último mensaje
    await updateDoc(doc(db, "chats", chatId), {
      lastMessage: newMessage,
      lastMessageTimestamp: serverTimestamp(),
      lastMessageSenderId: userId,
    });

    setNewMessage(""); // Limpiar el campo de texto
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
  }
};

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      {/* Lista de Mensajes */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageContainer,
              item.senderId === userId ? styles.sentMessage : styles.receivedMessage,
            ]}
          >
            <Text style={styles.messageText}>{item.text}</Text>
            <Text style={styles.timestamp}>
              {item.timestamp instanceof Date
                ? item.timestamp.toLocaleTimeString() // Formatear la fecha si es un objeto Date
                : "Fecha desconocida"}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.messagesContainer}
      />

      {/* Campo de Entrada de Mensajes */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Escribe un mensaje..."
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  messagesContainer: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  messageContainer: {
    maxWidth: "80%",
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
  },
  sentMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#DCF8C6",
  },
  receivedMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#ECECEC",
  },
  messageText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#ccc",
    paddingTop: 8,
  },
  input: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    marginRight: 8,
  },
  sendButton: {
    padding: 8,
    backgroundColor: "#007BFF",
    borderRadius: 20,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default ChatScreen;