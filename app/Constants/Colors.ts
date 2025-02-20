// constants/Colors.ts
import { useColorScheme } from "react-native";

export const Colors = {
  light: {
    primary: "#6200EE", // Color principal (morado)
    secondary: "#03DAC6", // Color secundario (verde cian)
    background: "#FFFFFF", // Fondo claro
    text: "#000000", // Texto oscuro
    card: "#FFFFFF", // Fondo de tarjetas
    border: "#E0E0E0", // Bordes
    button: "#007BFF", // Botón
  },
  dark: {
    primary: "#BB86FC", // Color principal en modo oscuro
    secondary: "#03DAC6", // Color secundario (igual en ambos modos)
    background: "#121212", // Fondo oscuro
    text: "#FFFFFF", // Texto claro
    card: "#1E1E1E", // Fondo de tarjetas oscuro
    border: "#303030", // Bordes oscuros
    button: "#BB86FC", // Botón en modo oscuro
  },
};

export const useAppTheme = () => {
  const colorScheme = useColorScheme(); // Detecta el tema del sistema ("light" o "dark")
  return Colors[colorScheme === "dark" ? "dark" : "light"];
};