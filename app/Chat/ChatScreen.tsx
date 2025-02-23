import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { db } from "../../config/firebaseConfig";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { useLocalSearchParams } from "expo-router";

// Configurar dayjs para tiempos relativos
dayjs.extend(relativeTime);

const ChatScreen: React.FC = () => {
  const { chatId, userId } = useLocalSearchParams<{ chatId: string; userId: string }>();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const colorScheme = useColorScheme(); // Detectar el esquema de color
  const scrollViewRef = useRef<ScrollView>(null); // Referencia para el ScrollView

  // Listener para hacer scroll al final cuando se abre el teclado
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => {
      // Pequeño retardo para que se ajuste el layout
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return () => keyboardDidShowListener.remove();
  }, []);

  // Cargar mensajes del chat en tiempo real
  useEffect(() => {
    if (!chatId) return;
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messagesData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp;
        const convertedTimestamp =
          timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
        return {
          id: doc.id,
          ...data,
          timestamp: convertedTimestamp,
        };
      });
      setMessages(messagesData);
      // Desplazarse al final de la lista cuando llegan nuevos mensajes
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);
    });
    return () => unsubscribe(); // Limpiar el listener al desmontar el componente
  }, [chatId]);

  // Enviar un nuevo mensaje
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const messagesRef = collection(db, "chats", chatId, "messages");
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: userId,
        timestamp: serverTimestamp(),
      });
      // Actualizar el documento del chat con el último mensaje
      await updateDoc(doc(db, "chats", chatId), {
        lastMessage: newMessage,
        lastMessageTimestamp: serverTimestamp(),
        lastMessageSenderId: userId,
      });
      setNewMessage(""); // Limpiar el campo de texto
      // Desplazarse al final después de enviar un mensaje
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
    }
  };

  // Colores dinámicos para el modo oscuro/claro
  const backgroundColor = colorScheme === "dark" ? "#121212" : "#fff";
  const textColor = colorScheme === "dark" ? "#fff" : "#000";
  const borderColor = colorScheme === "dark" ? "#333" : "#ccc";
  const sentMessageColor = colorScheme === "dark" ? "#3CB371" : "#DCF8C6";
  const receivedMessageColor = colorScheme === "dark" ? "#444" : "#ECECEC";
  const inputBackgroundColor = colorScheme === "dark" ? "#333" : "#f5f5f5";
  const placeholderTextColor = colorScheme === "dark" ? "#aaa" : "#666";

  return (
    <KeyboardAvoidingView
      behavior={"padding"}
      style={{ flex: 1, backgroundColor }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Contenedor Principal */}
      <View style={{ flex: 1 }}>
        {/* Lista de Mensajes */}
        <ScrollView
          ref={scrollViewRef} // Asignar la referencia
          contentContainerStyle={[styles.messagesContainer, { backgroundColor }]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.senderId === userId ? styles.sentMessage : styles.receivedMessage,
                message.senderId === userId
                  ? { backgroundColor: sentMessageColor }
                  : { backgroundColor: receivedMessageColor },
              ]}
            >
              <Text style={[styles.messageText, { color: textColor }]}>{message.text}</Text>
              <Text style={[styles.timestamp, { color: textColor }]}>
                {message.timestamp instanceof Date
                  ? dayjs(message.timestamp).fromNow()
                  : "Fecha desconocida"}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Campo de Entrada de Mensajes */}
        <View style={[styles.inputContainer, { borderTopColor: borderColor }]}>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: inputBackgroundColor, color: textColor },
            ]}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={placeholderTextColor}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={styles.sendButtonText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  messagesContainer: {
    flexGrow: 1,
    paddingBottom: 16, // Espacio adicional en la parte inferior
  },
  messageContainer: {
    maxWidth: "80%",
    marginVertical: 8,
    padding: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sentMessage: {
    alignSelf: "flex-end",
  },
  receivedMessage: {
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 8 : 0, // Ajustar para iOS
    paddingHorizontal: 16, // Añadir espacio horizontal
  },
  input: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 24,
    marginRight: 8,
  },
  sendButton: {
    padding: 12,
    backgroundColor: "#007BFF",
    borderRadius: 24,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default ChatScreen;
