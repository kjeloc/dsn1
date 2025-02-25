import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, useColorScheme } from 'react-native';
import { db } from '../../../config/firebaseConfig';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp, getDocs, getDoc, doc, where } from "firebase/firestore";
import { useLocalSearchParams } from 'expo-router';
import { Message } from "../../utils/types";

const GroupChatScreen: React.FC = () => {
  const { userId } = useLocalSearchParams();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [dentistEmail, setDentistEmail] = useState<string>("");
  const [userNames, setUserNames] = useState<{ [key: string]: string }>({}); // Almacena nombres de usuarios por email
  const colorScheme = useColorScheme(); // Detectar el esquema de color del dispositivo

  useEffect(() => {
    if (!groupId) return;

    const messagesRef = collection(db, 'workgroups', groupId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const fetchUserNames = async (email: string) => {
      try {
        console.log("Buscando nombre para el correo:", email); // Depuración
        const userQuery = query(collection(db, "userTest"), where("email", "==", email));
        const querySnapshot = await getDocs(userQuery);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          console.log("Datos encontrados:", userData); // Depuración
          return userData?.name || "Desconocido"; // Devuelve el nombre o "Desconocido" si no existe
        } else {
          console.error(`Documento no encontrado para el correo: ${email}`);
        }
      } catch (error) {
        console.error("Error al obtener nombre del usuario:", error);
      }
      return "Desconocido";
    };

    const fetchDentistData = async () => {
      if (!userId) return;
      try {
        console.log("Buscando datos del dentista para el ID:", userId); // Depuración
        const userDoc = await getDoc(doc(db, "userTest", userId as string));
        if (userDoc.exists()) {
          const data = userDoc.data();
          console.log("Datos del dentista encontrados:", data); // Depuración
          setDentistEmail(data?.email || "");
        } else {
          console.error(`Documento no encontrado para el ID: ${userId}`);
        }
      } catch (error) {
        console.error("Error al obtener datos del dentista:", error);
      }
    };

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
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

      // Obtener nombres de usuarios para cada mensaje
      const updatedUserNames: { [key: string]: string } = {};
      for (const message of messagesData) {
        if (!userNames[message.senderEmail]) {
          const name = await fetchUserNames(message.senderEmail);
          updatedUserNames[message.senderEmail] = name;
        }
      }

      setUserNames((prevNames) => ({ ...prevNames, ...updatedUserNames }));
      fetchDentistData();
      setMessages(messagesData);
    });

    return () => unsubscribe(); // Limpiar el listener al desmontar el componente
  }, [groupId, userId]);

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
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#121212' : '#F9F9F9' }]}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageContainer,
              item.senderEmail === dentistEmail ? styles.sentMessage : styles.receivedMessage,
              { backgroundColor: item.senderEmail === dentistEmail ? (colorScheme === 'dark' ? '#4CAF50' : '#DCF8C6') : (colorScheme === 'dark' ? '#333' : '#ECECEC') },
            ]}
          >
            <Text style={[styles.senderName, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
              {userNames[item.senderEmail] || "Desconocido"}
            </Text>
            <Text style={[styles.messageText, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>{item.text}</Text>
            <Text style={[styles.timestamp, { color: colorScheme === 'dark' ? '#aaa' : '#666' }]}>
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
          style={[
            styles.input,
            {
              backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#FFF',
              borderColor: colorScheme === 'dark' ? '#444' : '#ccc',
              color: colorScheme === 'dark' ? '#fff' : '#000',
            },
          ]}
          placeholder="Escribe un mensaje..."
          placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#888'}
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: colorScheme === 'dark' ? '#761FE0' : '#007BFF' },
          ]}
          onPress={sendMessage}
        >
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
  },
  receivedMessage: {
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
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
    borderRadius: 20,
    marginRight: 8,
  },
  sendButton: {
    padding: 8,
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default GroupChatScreen;