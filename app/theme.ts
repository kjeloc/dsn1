// app/theme.ts
import { StyleSheet } from "react-native";

export const lightTheme = {
  colors: {
    primary: "#007BFF",
    background: "#FFFFFF",
    card: "#F9F9F9",
    text: "#333333",
    border: "#E0E0E0",
    secondary: "#6C757D",
    success: "#28A745",
    error: "#DC3545",
  },
  fonts: {
    regular: "System",
    bold: "System-Bold",
  },
  spacing: {
    small: 8,
    medium: 16,
    large: 24,
  },
};

export const darkTheme = {
  colors: {
    primary: "#007BFF",
    background: "#121212",
    card: "#1E1E1E",
    text: "#FFFFFF",
    border: "#333333",
    secondary: "#888888",
    success: "#28A745",
    error: "#FF4D4D",
  },
  fonts: {
    regular: "System",
    bold: "System-Bold",
  },
  spacing: {
    small: 8,
    medium: 16,
    large: 24,
  },
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});