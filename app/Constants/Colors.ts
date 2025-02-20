// constants/Colors.ts
import { useColorScheme } from "react-native";

export const Colors = {
  light: {
    primary: "#6200EE", // Color principal (morado)
    secondary: "#03DAC6", // Color secundario (verde cian)
    background: "#FFFFFF", // Fondo claro
    text: "#000000", // Texto oscuro
    card: "#FFFFFF", // Fondo de tarjetas
    cardWeather: "rgba(53, 52, 52, 0) ",
    border: "#E0E0E0", // Bordes
    button: "#007BFF", // Botón
    error: "#FF0000",
    modalBackground: "rgba(0, 0, 0, 0.5)",
    color: "rgba(114, 111, 111, 0.73)",
    userBubble: "#dcfce7", // Burbuja del usuario
    botBubble: "#e0e7ff",
    textPrimary: "#1e293b", // Texto principal
    textSecondary: "#475569", // Texto secundario
    TipstextPrimary: "#1e293b", // Texto principal
    TipstextSecondary: "#475569", // Texto secundario
    mode: "light",
  },
  dark: {
    primary: "#BB86FC", // Color principal en modo oscuro
    secondary: "#03DAC6", // Color secundario (igual en ambos modos)
    background: "#121212", // Fondo oscuro
    text: "#FFFFFF", // Texto claro
    card: "#1E1E1E", // Fondo de tarjetas oscuro
    cardWeather: "rgba(53, 52, 52, 0) ",
    border: "#303030", // Bordes oscuros
    button: "#BB86FC", // Botón en modo oscuro
    error: "#FF4500",
    modalBackground: "rgba(255, 255, 255, 0.5)",
    color:"rgba(53, 52, 52, 0.59)",
    userBubble: "#2e7d32", // Burbuja del usuario (verde oscuro)
    botBubble: "#1a237e", // Burbuja del bot (azul oscuro)
    textPrimary: "#ffffff", // Texto principal
    textSecondary: "#b0bec5", // Texto secundario
    TipstextPrimary: "#ffffff", // Texto principal
    TipstextSecondary: "#b0bec5", // Texto secundario
    mode: "dark",
  },


};

export const useAppTheme = () => {
  const colorScheme = useColorScheme(); // Detecta el tema del sistema ("light" o "dark")
  return Colors[colorScheme === "dark" ? "dark" : "light"];
};