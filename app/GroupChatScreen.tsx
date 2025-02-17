// app/GroupChatScreen.tsx
import React, { useEffect, useState } from 'react';
import {  View,  Text,  StyleSheet,  FlatList,  TextInput,  
TouchableOpacity,  KeyboardAvoidingView,Platform,} from 'react-native';
import { db } from '../config/firebaseConfig';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp,getDoc,doc} from "firebase/firestore";;
import { useLocalSearchParams } from 'expo-router';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderEmail: string;
  timestamp: Date | Timestamp;
}

const GroupChatScreen: React.FC = () => {
  const { userId } = useLocalSearchParams();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [dentistEmail, setDentistEmail] = useState<string>("");

  useEffect(() => {
    if (!groupId) return;
    const messagesRef = collection(db, 'workgroups', groupId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    const fetchDentistData = async () => {
          if (!userId) return;
          try {
            const userDoc = await getDoc(doc(db, "userTest", userId as string));
            if (userDoc.exists()) {
              const data = userDoc.data();
              setDentistEmail(data?.email || "");
            }
          } catch (error) {
            console.error("Error al obtener datos del dentista:", error);
          }
        };
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messagesData: Message[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp;

        // Convertir Timestamp a Date si es necesario
        const convertedTimestamp = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;

        return {
          id: doc.id,
          ...data,
          timestamp: convertedTimestamp, // Usar la fecha convertida
        };
      }) as Message[];
      fetchDentistData();
      setMessages(messagesData);
    });

    return () => unsubscribe(); // Limpiar el listener al desmontar el componente
  }, [groupId,userId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const messagesRef = collection(db, 'workgroups', groupId, 'messages');

      await addDoc(messagesRef, {
        text: newMessage,
        senderId: userId, // Reemplaza 'userId' con el ID del usuario actual
        senderEmail: dentistEmail, // Reemplaza 'userEmail' con el email del usuario actual
        timestamp: serverTimestamp(), // Usar serverTimestamp para sincronización
      });

      setNewMessage(''); // Limpiar el campo de texto
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
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
                : 'Fecha desconocida'}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.messagesContainer}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje..."
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
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
    justifyContent: 'flex-end',
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECECEC',
  },
  messageText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#ccc',
    paddingTop: 8,
  },
  input: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    marginRight: 8,
  },
  sendButton: {
    padding: 8,
    backgroundColor: '#007BFF',
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default GroupChatScreen;