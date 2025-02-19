import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList,TextInput, } from "react-native";
import { db } from "../../../config/firebaseConfig";
import { doc, getDoc, collection, getDocs,query, where,addDoc } from "firebase/firestore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Forum,Comment } from "../../utils/types";

const VistaForos: React.FC = () => {
  const { id,userId } = useLocalSearchParams();
  const router = useRouter();
  const [foro, setForo] = useState<Forum | null>(null);
  const [comentarios, setComentarios] = useState<Comment[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");

  useEffect(() => {
    const fetchForo = async () => {
      if (!id) return;
      try {
        const foroDoc = await getDoc(doc(db, "forums", id as string));
        if (foroDoc.exists()) {
          setForo({ id: foroDoc.id, ...foroDoc.data() } as Forum);
        }
      } catch (error) {
        console.error("Error al obtener el foro:", error);
      }
    };
    const fetchDentistData = async () => {
          if (!userId) return;
          try {
            const userDoc = await getDoc(doc(db, "userTest", userId as string));
            if (userDoc.exists()) {
              const data = userDoc.data();
              setAuthorEmail(data?.email || "");
            }
          } catch (error) {
            console.error("Error al obtener datos del dentista:", error);
          }
        };
    fetchDentistData();
    fetchForo();
  }, [id,userId]);

  useEffect(() => {
    const fetchComentarios = async () => {
      if (!id) return;
      try {
        const q = query(collection(db, "forums", id as string, "comentarios"));
        const querySnapshot = await getDocs(q);
        const comentariosData: Comment[] = [];
        querySnapshot.forEach((doc) => {
          comentariosData.push({ id: doc.id, ...doc.data() } as Comment);
        });
        setComentarios(comentariosData);
      } catch (error) {
        console.error("Error al obtener comentarios:", error);
      }
    };
    fetchComentarios();
  }, [id]);

  const handleAgregarComentario = async () => {
    if (!id || !nuevoComentario) return;
    try {
      await addDoc(collection(db, "forums", id as string, "comentarios"), {
        comentador: authorEmail, // Aquí deberías obtener el correo del usuario actual
        respuesta: nuevoComentario,
      });
      setNuevoComentario("");
      // Recargar comentarios
      const q = query(collection(db, "forums", id as string, "comentarios"));
      const querySnapshot = await getDocs(q);
      const comentariosData: Comment[] = [];
      querySnapshot.forEach((doc) => {
        comentariosData.push({ id: doc.id, ...doc.data() } as Comment);
      });
      setComentarios(comentariosData);
    } catch (error) {
      console.error("Error al agregar comentario:", error);
    }
  };

  return (
    <View style={styles.container}>
      {foro && (
        <>
          <Text style={styles.title}>{foro.title}</Text>
          <Text style={styles.info}>
            Autor: {foro.author} | Categoría: {foro.category} | Tipo: {foro.type} | Fecha: {foro.date}
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
          <TouchableOpacity style={styles.agregarComentarioButton} onPress={handleAgregarComentario}>
            <Text style={styles.agregarComentarioButtonText}>Agregar Comentario</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F9F9F9",
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