import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  Platform,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { API_AI } from "../../../config/apiConfig";
import { useAppTheme } from "../../Constants/Colors"; // Importar los colores dinámicos

const DentalTips = () => {
  const theme = useAppTheme(); // Obtener el tema dinámico
  const [topic, setTopic] = useState(""); // Tema ingresado por el usuario
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]); // Historial de mensajes
  const [loading, setLoading] = useState(false); // Estado de carga

  // Inicializa el cliente de la API con tu clave
  const genAI = new GoogleGenerativeAI(API_AI);

  // Función para obtener consejos odontológicos
  const fetchDentalTips = async () => {
    if (!topic.trim()) {
      setMessages((prev) => [
        ...prev,
        { text: "Por favor, ingresa un tema válido.", isUser: false },
      ]);
      return;
    }

    setLoading(true);
    setMessages((prev) => [...prev, { text: topic, isUser: true }]); // Agrega el mensaje del usuario

    try {
      // Obtén el modelo generativo de Gemini
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      // Define el prompt para obtener consejos odontológicos
      const prompt = `Dame un consejo breve sobre cuidados odontológicos enfocados en: ${topic}. Si el tema no está relacionado con odontología, indícame que reformule mi pregunta.`;
      // Genera el contenido con el modelo
      const result = await model.generateContent(prompt);
      const responseText = await result.response.text();

      // Limita la respuesta a 300 caracteres
      const limitedResponse = responseText.slice(0, 300).trim();
      setMessages((prev) => [...prev, { text: limitedResponse, isUser: false }]);
    } catch (error) {
      console.error("Error al obtener el consejo:", error);
      setMessages((prev) => [
        ...prev,
        { text: "Ocurrió un error. Intenta nuevamente.", isUser: false },
      ]);
    } finally {
      setLoading(false);
      setTopic(""); // Limpia el campo de entrada
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* KeyboardAwareScrollView */}
      <KeyboardAwareScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 16,
          justifyContent: messages.length === 0 ? "center" : "flex-start",
        }}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={Platform.OS === "ios" ? 100 : 0} // Espacio adicional en iOS
      >
        {/* Mensaje de bienvenida si no hay mensajes */}
        {messages.length === 0 && (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: theme.TipstextPrimary,
                textAlign: "center",
              }}
            >
              Consejos Dentales
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: theme.TipstextSecondary,
                textAlign: "center",
                marginTop: 8,
              }}
            >
              Haz tu consulta y obtén respuestas personalizadas.
            </Text>
          </View>
        )}

        {/* Historial de mensajes */}
        {messages.map((message, index) => (
          <View
            key={index}
            style={{
              alignSelf: message.isUser ? "flex-end" : "flex-start",
              maxWidth: "80%",
              marginVertical: 4,
              padding: 12,
              borderRadius: 16,
              backgroundColor: message.isUser
                ? theme.userBubble
                : theme.botBubble,
            }}
          >
            <Text style={{ color: theme.TipstextPrimary }}>{message.text}</Text>
          </View>
        ))}

        {/* Indicador de carga */}
        {loading && (
          <View
            style={{
              alignSelf: "flex-start",
              padding: 12,
              borderRadius: 16,
              backgroundColor: theme.botBubble,
            }}
          >
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        )}
      </KeyboardAwareScrollView>

      {/* Campo de entrada y botón */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 8,
          borderTopWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.background,
        }}
      >
        <TextInput
          placeholder="Escribe un tema..."
          placeholderTextColor={theme.textSecondary}
          value={topic}
          onChangeText={(text) => setTopic(text.slice(0, 50))} // Limita a 50 caracteres
          maxLength={50}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.background,
            color: theme.textPrimary,
            marginRight: 8,
          }}
        />
        <Button
          onPress={fetchDentalTips}
          title={loading ? "Espera..." : "Enviar"}
          disabled={loading}
          color={theme.primary}
        />
      </View>
    </View>
  );
};

export default DentalTips;