import { GOOGLE_GENERATIVE_AI_KEY } from '@env'; // Importa la clave de la API desde .env
import React, { useState } from "react";
import { ScrollView, View, Text, TextInput, Button } from "react-native";
import { GoogleGenerativeAI } from "@google/generative-ai";

const DentalCareTips = () => {
  const [topic, setTopic] = useState(""); // Tema ingresado por el usuario
  const [response, setResponse] = useState(""); // Respuesta de la API
  const [loading, setLoading] = useState(false); // Estado de carga

  // Inicializa el cliente de la API con tu clave
  const genAI = new GoogleGenerativeAI(GOOGLE_GENERATIVE_AI_KEY);

  const fetchDentalTips = async () => {
    if (!topic) return;
    setLoading(true);

    try {
      // Obtén el modelo generativo de Gemini
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Define el prompt para obtener consejos odontológicos
      const prompt = `Dame consejos prácticos y resumidos sobre cuidados odontológicos relacionados con: ${topic}, en menos de 200 palabras.`;

      // Genera el contenido con el modelo
      const result = await model.generateContent(prompt);
      const response = await result.response;

      // Extrae el texto de la respuesta y actualiza el estado
      setResponse(response.text());
    } catch (error) {
      console.error("Error al obtener el consejo:", error);
      setResponse("Ocurrió un error. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // Función para procesar el texto y convertir las palabras con ** a negrita
  const renderResponseWithBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g); // Divide el texto en partes usando el patrón **...**
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        // Si el texto está rodeado por **, lo hacemos negrita
        return (
          <Text key={index} style={{ fontWeight: "bold", color: "#0f172a" }}>
            {part.slice(2, -2)} {/* Elimina los ** */}
          </Text>
        );
      }
      return (
        <Text key={index} style={{ color: "#0f172a" }}>
          {part}
        </Text>
      );
    });
  };

  return (
    <ScrollView
      style={{ flex: 1, padding: 16, backgroundColor: "#f9fafb" }}
      contentContainerStyle={{ alignItems: "center" }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 600,
          borderRadius: 12,
          padding: 24,
          backgroundColor: "#fff",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 5,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 16, color: "#1e293b" }}>
          Consejos Odontológicos
        </Text>
        <Text style={{ marginBottom: 16, color: "#475569" }}>
          Escribe un tema relacionado con el cuidado dental y obtén consejos personalizados.
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <TextInput
            placeholder="Ejemplo: higiene bucal, caries, encías"
            value={topic}
            onChangeText={setTopic}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#e2e8f0",
              backgroundColor: "#f8fafc",
              marginRight: 8,
            }}
          />
          <Button
            onPress={fetchDentalTips}
            title={loading ? "Generando..." : "Obtener Consejos"}
            disabled={loading}
            color="#3b82f6"
          />
        </View>
        {response && (
          <View
            style={{
              marginTop: 16,
              backgroundColor: "#f0f9ff",
              padding: 16,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#bfdbfe",
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 8, color: "#1e40af" }}>
              Resultado:
            </Text>
            <Text style={{ lineHeight: 24 }}>{renderResponseWithBold(response)}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default DentalCareTips;