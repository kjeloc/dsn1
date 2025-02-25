import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList,TextInput, } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Forum,Comment } from "../../utils/types";
import { fetchForumById, fetchForumComments, addCommentToForum, getUserEmailFromId,} from "../../utils/firebaseService";


const VistaForos: React.FC = () => {
  const { id, userId } = useLocalSearchParams<{ id: string; userId: string }>();
  const [foro, setForo] = useState<Forum | null>(null);
  const [comentarios, setComentarios] = useState<Comment[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");

  // Cargar datos del foro y del usuario
  useEffect(() => {
    const loadForumAndUserData = async () => {
      if (!id || !userId) return;

      try {
        // Obtener datos del foro
        const forumData = await fetchForumById(id);
        setForo(forumData);

        // Obtener el correo del usuario actual
        const userEmail = await getUserEmailFromId(userId);
        setAuthorEmail(userEmail || "");
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }
    };

    loadForumAndUserData();
  }, [id, userId]);

  // Cargar comentarios del foro
  useEffect(() => {
    const loadComments = async () => {
      if (!id) return;

      try {
        const commentsData = await fetchForumComments(id);
        setComentarios(commentsData);
      } catch (error) {
        console.error("Error al cargar comentarios:", error);
      }
    };

    loadComments();
  }, [id]);

  // Agregar un nuevo comentario
  const handleAgregarComentario = async () => {
    if (!id || !nuevoComentario.trim()) return;

    try {
      await addCommentToForum(id, {
        comentador: authorEmail,
        respuesta: nuevoComentario,
      });

      setNuevoComentario("");

      // Recargar comentarios después de agregar uno nuevo
      const updatedComments = await fetchForumComments(id);
      setComentarios(updatedComments);
    } catch (error) {
      console.error("Error al agregar comentario:", error);
    }
  };

  if (!foro) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando foro...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{foro.title}</Text>
      <Text style={styles.info}>
        Autor: {foro.author} | Categoría: {foro.category} | Tipo: {foro.type} | Fecha:{" "}
        {foro.date}
      </Text>
      <Text style={styles.content}>{foro.content}</Text>

      <Text style={styles.sectionTitle}>Comentarios</Text>
      <FlatList
        data={comentarios}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.commentItem}>
            <Text style={styles.commentComentador}>{item.comentador}</Text>
            <Text style={styles.commentTexto}>{item.respuesta}</Text>
          </View>
        )}
      />

      <Text style={styles.sectionTitle}>Agregar Comentario</Text>
      <TextInput
        style={styles.commentInput}
        placeholder="Escribe tu comentario"
        value={nuevoComentario}
        onChangeText={setNuevoComentario}
      />
      <TouchableOpacity
        style={styles.agregarComentarioButton}
        onPress={handleAgregarComentario}
      >
        <Text style={styles.agregarComentarioButtonText}>
          Agregar Comentario
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F9F9F9",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  info: {
    fontSize: 16,
    color: "#555",
    marginBottom: 10,
  },
  content: {
    fontSize: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  commentItem: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  commentComentador: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  commentTexto: {
    fontSize: 14,
    color: "#333",
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#CCC",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#FFF",
  },
  agregarComentarioButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  agregarComentarioButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});



export default VistaForos;