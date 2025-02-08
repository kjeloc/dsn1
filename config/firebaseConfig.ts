import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth"; // Importa initializeAuth y getReactNativePersistence
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage"; // Para persistencia en React Native
import { getFirestore } from "firebase/firestore";

// Configuración de Firebase (reemplaza con tus propios valores)
const firebaseConfig = {
  apiKey: "AIzaSyCuIwlMaf9cr7ELRX0J6fM3hPeJLwU7miM",
  authDomain: "dsnalphaver.firebaseapp.com",
  projectId: "dsnalphaver",
  storageBucket: "dsnalphaver.firebasestorage.app",
  messagingSenderId: "472252711221",
  appId: "1:472252711221:web:fc1ad1bc7f46ea9a428c7c",
  measurementId: "G-MC7RZ1MT97",
};

// Inicializar Firebase App
const app = initializeApp(firebaseConfig);

// Inicializar Firebase Auth con persistencia usando AsyncStorage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage), // Configuramos la persistencia
});

// Inicializar Firestore
const db = getFirestore(app);

// Exportamos auth y db para usarlos en otros archivos
export { auth, db };