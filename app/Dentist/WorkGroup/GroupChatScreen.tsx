import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform,} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { subscribeToGroupMessages, sendMessageToGroup, getUserEmailFromId,} from "../../utils/firebaseService";
import { Message } from "../../utils/types";

const GroupChatScreen: React.FC = () => {
  const { userId } = useLocalSearchParams();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [dentistEmail, setDentistEmail] = useState<string>("");

  // Cargar el correo del usuario y suscribirse a los mensajes del grupo
  useEffect(() => {
    const loadUserDataAndMessages = async () => {
      if (!userId || !groupId) return;

      try {
        // Obtener el correo del usuario
        const userEmail = await getUserEmailFromId(userId as string);
        if (userEmail) {
          setDentistEmail(userEmail);
        }

        // Suscribirse a los mensajes del grupo
        const unsubscribe = subscribeToGroupMessages(
          groupId,
          (messagesData) => {
            setMessages(messagesData);
          }
        );

        return () => unsubscribe(); // Limpiar el listener al desmontar el componente
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }
    };

    loadUserDataAndMessages();
  }, [groupId, userId]);

  // Enviar un nuevo mensaje
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await sendMessageToGroup(
        groupId,
        userId as string,
        dentistEmail,
        newMessage
      );
      setNewMessage(""); // Limpiar el campo de texto
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>{item.text}</Text>
            <Text style={styles.timestamp}>
              {item.timestamp instanceof Date
                ? item.timestamp.toLocaleTimeString()
                : "Fecha desconocida"}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.messagesContainer}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje..."
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
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

export default GroupChatScreen;
