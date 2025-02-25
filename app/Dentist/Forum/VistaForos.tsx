import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, useColorScheme } from "react-native";
import { db } from "../../../config/firebaseConfig";
import { doc, getDoc, collection, getDocs, query, where, addDoc } from "firebase/firestore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Forum, Comment } from "../../utils/types";

const VistaForos: React.FC = () => {
  const { id, userId } = useLocalSearchParams();
  const router = useRouter();
  const [foro, setForo] = useState<Forum | null>(null);
  const [comentarios, setComentarios] = useState<Comment[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const colorScheme = useColorScheme(); // Detectar el esquema de color del dispositivo

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
  }, [id, userId]);

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
        comentador: authorEmail,
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
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#121212' : '#F9F9F9' }]}>
      {foro && (
        <>
          <Text style={[styles.title, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>{foro.title}</Text>
          <Text style={[styles.info, { color: colorScheme === 'dark' ? '#bbb' : '#555' }]}>
            Autor: {foro.author || "Desconocido"} | Categoría: {foro.category} | Tipo: {foro.type} | Fecha: {foro.date}
          </Text>
          <Text style={[styles.content, { color: colorScheme === 'dark' ? '#fff' : '#333' }]}>{foro.content}</Text>

          <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>Comentarios</Text>
          <FlatList
            data={comentarios}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.commentItem,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#FFF',
                    shadowColor: colorScheme === 'dark' ? '#000' : '#ccc',
                  },
                ]}
              >
                <Text style={[styles.commentComentador, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
                  {item.comentador || "Anónimo"}
                </Text>
                <Text style={[styles.commentTexto, { color: colorScheme === 'dark' ? '#bbb' : '#333' }]}>
                  {item.respuesta}
                </Text>
              </View>
            )}
          />

          <Text style={[styles.sectionTitle, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            Agregar Comentario
          </Text>
          <TextInput
            style={[
              styles.commentInput,
              {
                backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#FFF',
                borderColor: colorScheme === 'dark' ? '#444' : '#CCC',
                color: colorScheme === 'dark' ? '#fff' : '#000',
              },
            ]}
            placeholder="Escribe tu comentario"
            placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#888'}
            value={nuevoComentario}
            onChangeText={setNuevoComentario}
          />
          <TouchableOpacity
            style={[
              styles.agregarComentarioButton,
              { backgroundColor: colorScheme === 'dark' ? '#761FE0' : '#007BFF' },
            ]}
            onPress={handleAgregarComentario}
          >
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
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  info: {
    fontSize: 16,
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
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
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
  },
  commentInput: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  agregarComentarioButton: {
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