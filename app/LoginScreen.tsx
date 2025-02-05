import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet, Text, Alert } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../config/firebaseConfig";
import { useRouter,useLocalSearchParams } from "expo-router";


const LoginScreen = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();
    const { userId } = useLocalSearchParams();

    const handleLogin = async () => {
      try {
        // Buscar el usuario en la colección "userTest"
        const usersRef = collection(db, "userTest");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);
  
        if (querySnapshot.empty) {
          Alert.alert("Error", "Usuario no encontrado");
          return;
        }
        
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        if (userData.password !== password) {
          Alert.alert("Error", "Contraseña incorrecta");
          return;
        }
  
        // Redirigir según el rol del usuario
        if (userData.rol === "Admin") {
          router.push("/menuAdmin");
        } else if (userData.rol === "Dentist") {
          router.push(`/menuDentist?userId=${userDoc.id}`);
        } else if (userData.rol === "Patient") {
          router.push(`/menuPatient?userId=${userDoc.id}`);
        } else {
          Alert.alert("Error", "Rol no válido");
        }
      } catch (error) {
        console.error("Error al iniciar sesión:", error);
        Alert.alert("Error", "Ocurrió un error al iniciar sesión");
      }
    };
  
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Iniciar Sesión</Text>
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button title="Iniciar Sesión" onPress={handleLogin} />
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#181818',  // Color oscuro de fondo, similar al de Discord
      justifyContent: 'center',
      alignItems: 'center',  // Centra los elementos en el contenedor
      padding: 20,
    },
    title: {
      fontSize: 28,  // Tamaño de fuente más grande
      marginBottom: 20,
      color: '#fff',  // Título en blanco para destacar sobre el fondo oscuro
      fontWeight: '600',  // Un poco más de grosor en el texto
    },
    input: {
      height: 50,  // Un input un poco más alto para mayor comodidad
      borderColor: '#333',  // Un borde oscuro, más en línea con Discord
      borderWidth: 1,
      marginBottom: 12,
      paddingHorizontal: 15,
      borderRadius: 8,  // Bordes redondeados más suaves
      backgroundColor: '#2c2f33',  // Fondo del input más oscuro
      color: '#fff',  // Texto dentro del input en blanco
      fontSize: 16,  // Tamaño de texto más adecuado para Discord
    },
  });
  
  export default LoginScreen;