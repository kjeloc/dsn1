// firebaseService.ts
import { db } from "../../config/firebaseConfig";
import { collection, addDoc, doc, getDoc, getDocs, updateDoc, query, where ,setDoc,
     orderBy, onSnapshot, serverTimestamp, Timestamp,deleteDoc} from "firebase/firestore";
import { UserAdmin, Forum, Appointment,UserChat,Chat,Message,DentistData,
    Comment,UserData,WorkgroupFormData,Workgroup} from "../utils/types";
import dayjs from "dayjs";
const IMGUR_CLIENT_ID = "64c190c058b9f98";
import * as ImageManipulator from "expo-image-manipulator";
import axios from "axios";

// Función para obtener los datos de un dentista
export const fetchDentistData = async (
  userId: string
): Promise<{ name?: string; email?: string }> => {
  try {
    const userDoc = await getDoc(doc(db, "userTest", userId));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return {};
  } catch (error) {
    console.error("Error al obtener los datos del dentista:", error);
    throw error;
  }
};

// Función para buscar el ID de un paciente basado en su correo electrónico
export const findPatientByEmail = async (email: string) => {
  try {
    const patientsQuery = await getDocs(
      query(collection(db, "userTest"), where("email", "==", email))
    );
    if (!patientsQuery.empty) {
      const patientDoc = patientsQuery.docs[0];
      return { id: patientDoc.id, ...patientDoc.data() };
    }
    return null;
  } catch (error) {
    console.error("Error al buscar el paciente:", error);
    throw error;
  }
};

// Función para agregar una cita en la subcolección del dentista
export const addAppointmentForDentist = async (
  dentistId: string,
  appointmentData: any
) => {
  try {
    await addDoc(
      collection(db, "userTest", dentistId, "appointments"),
      appointmentData
    );
  } catch (error) {
    console.error("Error al agregar la cita para el dentista:", error);
    throw error;
  }
};

// Función para agregar una cita en la subcolección del paciente
export const addAppointmentForPatient = async (
  patientId: string,
  appointmentData: any
) => {
  try {
    await addDoc(
      collection(db, "userTest", patientId, "appointments"),
      appointmentData
    );
  } catch (error) {
    console.error("Error al agregar la cita para el paciente:", error);
    throw error;
  }
};

export const fetchUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "UserTest"));
    const userList: UserAdmin[] = [];
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      userList.push({
        id: doc.id,
        name: userData.name,
        email: userData.email,
        rol: userData.rol,
      });
    });
    return userList;
  } catch (error) {
    console.error("Error al obtener los usuarios:", error);
    throw error;
  }
};

export const addForumPost = async (postData: any, authorEmail: string) => {
  try {
    await addDoc(collection(db, "forums"), {
      ...postData,
      date: dayjs().format("YYYY-MM-DD"),
      author: authorEmail,
    });
  } catch (error) {
    console.error("Error al agregar la publicación:", error);
    throw error;
  }
};
export const fetchForums = async (): Promise<Forum[]> => {
  try {
    const q = collection(db, "forums");
    const querySnapshot = await getDocs(q);
    const forumsData: Forum[] = [];
    querySnapshot.forEach((doc) => {
      forumsData.push({ id: doc.id, ...doc.data() } as Forum);
    });
    return forumsData;
  } catch (error) {
    console.error("Error al obtener los foros:", error);
    throw error;
  }
};

// Función para obtener las citas de un dentista
export const fetchAppointments = async (
  userId: string
): Promise<Appointment[]> => {
  try {
    const querySnapshot = await getDocs(
      collection(db, "userTest", userId, "appointments")
    );
    const appointmentList: Appointment[] = [];
    querySnapshot.forEach((doc) => {
      console.log("data:"+doc.id);
      appointmentList.push({
        id: doc.id,
        ...doc.data(),
      } as Appointment);
    });
    return appointmentList;
  } catch (error) {
    console.error("Error al obtener las citas:", error);
    throw error;
  }
};

export const fetchPatientData = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, "userTest", userId));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error("Error al obtener los datos del paciente:", error);
    throw error;
  }
};

export const updatePatientProfilePicture = async (
  userId: string,
  imageUrl: string
) => {
  try {
    const userRef = doc(db, "userTest", userId);
    await updateDoc(userRef, {
      profilePicture: imageUrl,
    });
  } catch (error) {
    console.error("Error al actualizar la imagen de perfil:", error);
    throw error;
  }
};

export const uploadImageToImgur = async (imageUri: string) => {
  try {
    // Redimensionar la imagen antes de subirla
    const resizedImageUri = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 800 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    const formData = new FormData();
    formData.append("image", {
      uri: resizedImageUri.uri,
      type: "image/jpeg",
      name: "profile.jpg",
    } as any);

    const response = await axios.post(
      "https://api.imgur.com/3/image",
      formData,
      {
        headers: {
          Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (response.data.success) {
      return response.data.data.link;
    } else {
      throw new Error("No se pudo subir la imagen a Imgur");
    }
  } catch (error) {
    console.error("Error al subir la imagen a Imgur:", error);
    throw error;
  }
};

// Obtener el correo electrónico del usuario actual basado en su ID
export const getUserEmailFromId = async (userId: string): Promise<string | null> => {
  try {
    const userDoc = await getDoc(doc(db, "userTest", userId));
    if (!userDoc.exists()) {
      throw new Error(`El usuario ${userId} no existe`);
    }
    const userData = userDoc.data();
    return userData.email || null; // Devolver el correo electrónico del usuario
  } catch (error) {
    console.error("Error al obtener el correo del usuario:", error);
    return null;
  }
};

// Obtener los chats del usuario
export const fetchUserChats = async (userEmail: string): Promise<Chat[]> => {
  try {
    const q = query(
      collection(db, "chats"),
      where("participantsEmail", "array-contains", userEmail)
    );
    const querySnapshot = await getDocs(q);
    const chatsData: Chat[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Chat[];
    return chatsData;
  } catch (error) {
    console.error("Error al cargar chats:", error);
    throw error;
  }
};

// Crear un nuevo chat
export const createNewChat = async (
  participant1Id: string,
  participant2Id: string,
  participant1Email: string,
  participant2Email: string
): Promise<string | null> => {
  try {
    // Ordenar los correos electrónicos para evitar problemas de consulta
    const sortedParticipantsEmail = [participant1Email, participant2Email].sort();

    // Verificar si ya existe un chat entre los dos participantes
    const q = query(
      collection(db, "chats"),
      where("participantsEmail", "==", sortedParticipantsEmail)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Si ya existe un chat, devolver su ID
      const existingChat = querySnapshot.docs[0];
      return existingChat.id;
    }

    // Si no existe un chat, crear uno nuevo
    const chatId = doc(collection(db, "chats")).id;
    await setDoc(doc(db, "chats", chatId), {
      participants: [participant1Id, participant2Id], // IDs de los documentos
      participantsEmail: sortedParticipantsEmail, // Correos electrónicos ordenados
    });

    return chatId;
  } catch (error) {
    console.error("Error al crear chat:", error);
    throw error;
  }
};

// Obtener usuarios disponibles para chatear
export const fetchAvailableUsers = async (
  userId: string,
  userEmail: string
): Promise<UserChat[]> => {
  try {
    const userDoc = await getDoc(doc(db, "userTest", userId));
    if (!userDoc.exists()) {
      throw new Error(`El usuario ${userId} no existe`);
    }
    const userData = userDoc.data() as UserChat;

    let availableUsers: UserChat[] = [];
    if (userData.rol === "Dentist") {
      // Odontólogos pueden chatear con otros odontólogos y sus pacientes asignados
      const allUsersQuery = query(collection(db, "userTest"));
      const allUsersSnapshot = await getDocs(allUsersQuery);
      availableUsers = allUsersSnapshot.docs
        .filter((doc) => {
          const data = doc.data();
          return data.email && data.email !== userEmail; // Excluir al usuario actual
        })
        .map((doc) => {
          const data = doc.data();
          return {
            email: data.email,
            name: data.name,
            rol: data.rol,
            patients: data.patients || [],
            dentist: data.dentist || undefined,
            id: doc.id, // Obtener el ID del documento correctamente
            profilePicture: data.profilePicture || undefined,
            state: data.state || undefined,
          } as UserChat;
        })
        .filter((userChat) => {
          // Mostrar otros odontólogos y pacientes asignados
          return (
            userChat.rol === "Dentist" || // Otros odontólogos
            (userData.patients && userData.patients.includes(userChat.email)) // Pacientes asignados
          );
        });
    } else if (userData.rol === "Patient") {
      // Pacientes solo pueden chatear con su odontólogo asignado
      const dentistEmail = userData.dentist;
      if (dentistEmail) {
        const dentistDoc = await getDoc(doc(db, "userTest", dentistEmail));
        if (dentistDoc.exists()) {
          const data = dentistDoc.data();
          availableUsers.push({
            email: data.email,
            name: data.name,
            rol: data.rol,
            patients: data.patients || [],
            dentist: data.dentist || undefined,
            id: dentistDoc.id, // Obtener el ID del documento correctamente
            profilePicture: data.profilePicture || undefined,
            state: data.state || undefined,
          } as UserChat);
        }
      }
    }

    return availableUsers;
  } catch (error) {
    console.error("Error al cargar usuarios disponibles:", error);
    throw error;
  }
};

// Cargar mensajes del chat en tiempo real
export const subscribeToChatMessages = (
  chatId: string,
  callback: (messages: Message[]) => void
) => {
  if (!chatId) return () => {}; // No hacer nada si no hay chatId

  const messagesRef = collection(db, "chats", chatId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const messagesData: Message[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      const timestamp = data.timestamp;
      // Convertir Timestamp a Date si es necesario
      const convertedTimestamp =
        timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;

      return {
        id: doc.id,
        ...data,
        timestamp: convertedTimestamp, // Usar la fecha convertida
      };
    }) as Message[];

    callback(messagesData); // Llamar al callback con los mensajes actualizados
  });

  return unsubscribe; // Retornar la función para limpiar el listener
};

// Enviar un nuevo mensaje
export const sendMessageToChat = async (
  chatId: string,
  senderId: string,
  text: string
) => {
  try {
    const messagesRef = collection(db, "chats", chatId, "messages");
    await addDoc(messagesRef, {
      text: text,
      senderId: senderId,
      senderEmail: senderId, // Aquí puedes usar el correo si lo prefieres
      timestamp: serverTimestamp(), // Usar serverTimestamp para sincronización
    });
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
    throw error;
  }
};


// Obtener los datos del dentista
export const fetchDentistDatas = async (userId: string): Promise<DentistData | null> => {
  try {
    const userDoc = await getDoc(doc(db, "userTest", userId));
    if (userDoc.exists()) {
      return userDoc.data() as DentistData;
    }
    return null;
  } catch (error) {
    console.error("Error al obtener los datos del dentista:", error);
    throw error;
  }
};

// Actualizar la imagen de perfil del dentista
export const updateDentistProfilePicture = async (
  userId: string,
  imageUrl: string
) => {
  try {
    const userRef = doc(db, "userTest", userId);
    await updateDoc(userRef, {
      profilePicture: imageUrl,
    });
  } catch (error) {
    console.error("Error al actualizar la imagen de perfil:", error);
    throw error;
  }
};
// Obtener los datos de un foro por su ID
export const fetchForumById = async (forumId: string): Promise<Forum | null> => {
  try {
    const forumDoc = await getDoc(doc(db, "forums", forumId));
    if (forumDoc.exists()) {
      return { id: forumDoc.id, ...forumDoc.data() } as Forum;
    }
    return null;
  } catch (error) {
    console.error("Error al obtener el foro:", error);
    throw error;
  }
};

// Obtener los comentarios de un foro
export const fetchForumComments = async (forumId: string): Promise<Comment[]> => {
  try {
    const q = query(collection(db, "forums", forumId, "comentarios"));
    const querySnapshot = await getDocs(q);
    const commentsData: Comment[] = [];
    querySnapshot.forEach((doc) => {
      commentsData.push({ id: doc.id, ...doc.data() } as Comment);
    });
    return commentsData;
  } catch (error) {
    console.error("Error al obtener comentarios:", error);
    throw error;
  }
};

// Agregar un comentario a un foro
export const addCommentToForum = async (
  forumId: string,
  commentData: { comentador: string; respuesta: string }
) => {
  try {
    await addDoc(collection(db, "forums", forumId, "comentarios"), commentData);
  } catch (error) {
    console.error("Error al agregar comentario:", error);
    throw error;
  }
};

export const fetchUserData = async (userId: string): Promise<UserData | null> => {
    try {
      const userDoc = await getDoc(doc(db, "userTest", userId));
      if (userDoc.exists()) {
        return userDoc.data() as UserData;
      }
      return null;
    } catch (error) {
      console.error("Error al obtener los datos del usuario:", error);
      throw error;
    }
  };
  
  // Obtener las citas del usuario
  export const fetchUserAppointments = async (userId: string): Promise<Appointment[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, "userTest", userId, "appointments"));
      const appointmentList: Appointment[] = [];
      querySnapshot.forEach((doc) => {
        appointmentList.push({ id: doc.id, ...doc.data() } as Appointment);
      });
      return appointmentList;
    } catch (error) {
      console.error("Error al obtener las citas:", error);
      throw error;
    }
  };

// Obtener todos los odontólogos disponibles
export const fetchDentists = async (): Promise<string[]> => {
  try {
    const q = query(collection(db, "userTest"), where("rol", "==", "Dentist"));
    const querySnapshot = await getDocs(q);
    const dentistsList: string[] = querySnapshot.docs.map((doc) => doc.data().email);
    return dentistsList;
  } catch (error) {
    console.error("Error fetching dentists:", error);
    throw error;
  }
};

// Crear un nuevo grupo de trabajo
export const createWorkgroup = async (workgroupData: WorkgroupFormData) => {
  try {
    const newWorkgroupRef = await addDoc(collection(db, "workgroups"), workgroupData);
    console.log("Workgroup added with ID: ", newWorkgroupRef.id);
    return newWorkgroupRef.id; // Retornar el ID del grupo creado
  } catch (error) {
    console.error("Error adding workgroup: ", error);
    throw error;
  }
};

// Obtener los mensajes del grupo en tiempo real
export const subscribeToGroupMessages = (
    groupId: string,
    callback: (messages: Message[]) => void
  ) => {
    if (!groupId) return () => {}; // No hacer nada si no hay groupId
  
    const messagesRef = collection(db, "workgroups", groupId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));
  
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messagesData: Message[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp;
        // Convertir Timestamp a Date si es necesario
        const convertedTimestamp =
          timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
  
        return {
          id: doc.id,
          ...data,
          timestamp: convertedTimestamp, // Usar la fecha convertida
        };
      }) as Message[];
  
      callback(messagesData); // Llamar al callback con los mensajes actualizados
    });
  
    return unsubscribe; // Retornar la función para limpiar el listener
  };
  
  // Enviar un mensaje al grupo
  export const sendMessageToGroup = async (
    groupId: string,
    senderId: string,
    senderEmail: string,
    text: string
  ) => {
    try {
      const messagesRef = collection(db, "workgroups", groupId, "messages");
      await addDoc(messagesRef, {
        text: text,
        senderId: senderId,
        senderEmail: senderEmail,
        timestamp: serverTimestamp(), // Usar serverTimestamp para sincronización
      });
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      throw error;
    }
  };
  export const fetchWorkgroupDetails = async (groupId: string): Promise<Workgroup | null> => {
    try {
      const docRef = doc(db, "workgroups", groupId);
      const docSnap = await getDoc(docRef);
  
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          name: docSnap.data().name || "",
          owner: docSnap.data().owner || "",
          admins: docSnap.data().admins || [],
          members: docSnap.data().members || [],
        } as Workgroup;
      }
  
      return null; // Retorna null si el documento no existe
    } catch (error) {
      console.error("Error fetching workgroup details:", error);
      throw error;
    }
  };
  
 // Obtener los grupos de trabajo en los que un usuario es miembro
export const fetchUserWorkgroups = async (userEmail: string): Promise<Workgroup[]> => {
    try {
      const q = query(
        collection(db, "workgroups"),
        where("memberEmails", "array-contains", userEmail)
      );
      const querySnapshot = await getDocs(q);
  
      const workgroupsData: Workgroup[] = [];
      querySnapshot.forEach((doc) => {
        workgroupsData.push({
          id: doc.id,
          name: doc.data().groupName || "",
          owner: doc.data().ownerEmail || "",
          admins: doc.data().adminEmails || [],
          members: doc.data().memberEmails || [],
        } as Workgroup);
      });
  
      return workgroupsData;
    } catch (error) {
      console.error("Error fetching user workgroups:", error);
      throw error;
    }
  };

  export const fetchAssociatedDentists = async (patientId: string): Promise<any[]> => {
    try {
      // Acceder directamente al documento del paciente usando su ID
      const patientRef = doc(db, "userTest", patientId);
      const patientDoc = await getDoc(patientRef);
  
      if (!patientDoc.exists()) {
        throw new Error(`El paciente con el ID ${patientId} no existe`);
      }
  
      const patientData = patientDoc.data();
      const dentistsArray = patientData?.dentists;
  
      if (!Array.isArray(dentistsArray) || dentistsArray.length === 0) {
        throw new Error("No hay odontólogos asociados a este paciente");
      }
  
      const dentistsData = await Promise.all(
        dentistsArray.map(async (dentistEmail: string) => {
          // Buscar el odontólogo en la colección userTest usando el campo 'email'
          const qDentist = query(collection(db, "userTest"), where("email", "==", dentistEmail));
          const dentistQuerySnapshot = await getDocs(qDentist);
  
          if (dentistQuerySnapshot.empty) {
            console.warn(`El odontólogo con email ${dentistEmail} no existe`);
            return null; // Ignorar este odontólogo
          }
  
          const dentistDoc = dentistQuerySnapshot.docs[0];
          const { name, AcPos, rol, state } = dentistDoc.data();
  
          // Validar que sea un dentista activo
          if (rol !== "Dentist") {
            console.warn(`El usuario con email ${dentistEmail} no es un dentista (rol: ${rol})`);
            return null; // Ignorar este odontólogo
          }
  
          // Validar que AcPos exista y tenga las propiedades latitude y longitude
          if (!AcPos || typeof AcPos.latitude !== "number" || typeof AcPos.longitude !== "number") {
            console.warn(`La ubicación del odontólogo con email ${dentistEmail} no está definida correctamente`);
            return null; // Ignorar este odontólogo
          }
  
          return {
            email: dentistEmail,
            name: name || "Odontólogo desconocido",
            location: { latitude: AcPos.latitude, longitude: AcPos.longitude },
          };
        })
      );
  
      // Filtrar los odontólogos válidos (ignorar los que son null)
      return dentistsData.filter((dentist) => dentist !== null);
    } catch (error) {
      console.error("Error al obtener los odontólogos asociados:", error);
      throw error;
    }
  };

// Obtener la ubicación y el nombre de un odontólogo por su correo electrónico
export const fetchDentistLocationAndName = async (dentistEmail: string): Promise<{
  name: string;
  location: { latitude: number; longitude: number };
} | null> => {
  try {
    if (!dentistEmail) {
      throw new Error("No se proporcionó el correo del odontólogo");
    }

    const q = query(collection(db, "userTest"), where("email", "==", dentistEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error(`El odontólogo ${dentistEmail} no existe`);
    }

    const dentistDoc = querySnapshot.docs[0];
    const dentistData = dentistDoc.data();
    const { AcPos, name } = dentistData;

    if (!AcPos || typeof AcPos.latitude !== "number" || typeof AcPos.longitude !== "number") {
      throw new Error("La ubicación del odontólogo no está definida correctamente");
    }

    return {
      name: name || "Odontólogo desconocido",
      location: { latitude: AcPos.latitude, longitude: AcPos.longitude },
    };
  } catch (error) {
    console.error("Error al obtener la ubicación del odontólogo:", error);
    throw error;
  }
};