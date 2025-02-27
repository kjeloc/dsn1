import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
  Alert,
} from "react-native";
import { db } from "../../config/firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { UserAdmin } from "../utils/types";
import { router } from "expo-router";

const MenuAdmin: React.FC = () => {
  const [Users, setUsers] = useState<UserAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredUsers, setFilteredUsers] = useState<UserAdmin[]>([]);
  const colorScheme = useColorScheme(); // Detectar el esquema de color del dispositivo

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "userTest"));
        const UserList: UserAdmin[] = [];
        querySnapshot.forEach((doc) => {
          const UserData = doc.data();
          UserList.push({
            id: doc.id,
            name: UserData.name || "Sin nombre",
            email: UserData.email || "Sin correo",
            rol: UserData.rol || "Rol desconocido",
            state: UserData.state || "Activo", // Asignar 'Activo' si no existe el estado
          });
        });
        setUsers(UserList);
        setFilteredUsers(UserList);
      } catch (error) {
        console.error("Error al obtener los usuarios:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filterUsersByRole = (role: string) => {
    if (role === "all") {
      setFilteredUsers(Users);
    } else {
      setFilteredUsers(Users.filter((UserAdmin) => UserAdmin.rol === role));
    }
  };

  const changeUserState = async (userId: string, currentState: string) => {
    try {
      // Determinar el nuevo estado
      const states = ["Activo", "Inactivo", "Prueba"];
      const currentIndex = states.indexOf(currentState);
      const newState = states[(currentIndex + 1) % states.length];

      // Actualizar el estado local
      const updatedUsers = Users.map((user) =>
        user.id === userId ? { ...user, state: newState } : user
      );
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);

      // Actualizar el estado en Firestore
      const userDocRef = doc(db, "userTest", userId);
      await updateDoc(userDocRef, { state: newState });

      Alert.alert("Estado actualizado", `El estado del usuario ha sido cambiado a ${newState}`);
    } catch (error) {
      console.error("Error al actualizar el estado del usuario:", error);
      Alert.alert("Error", "No se pudo actualizar el estado del usuario");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colorScheme === "dark" ? "#FFFFFF" : "#007BFF"} />
      </View>
    );
  }

  const getCardStyle = (role: string) => {
    switch (role) {
      case "Admin":
        return [
          styles.UserCard,
          { backgroundColor: colorScheme === "dark" ? "#333333" : "#D3D3D3" },
        ];
      case "Dentist":
        return [
          styles.UserCard,
          { backgroundColor: colorScheme === "dark" ? "#2E4053" : "#ADD8E6" },
        ];
      case "Patient":
        return [
          styles.UserCard,
          { backgroundColor: colorScheme === "dark" ? "#34495E" : "#B0C4DE" },
        ];
      default:
        return [
          styles.UserCard,
          { backgroundColor: colorScheme === "dark" ? "#121212" : "#FFFFFF" },
        ];
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colorScheme === "dark" ? "#121212" : "#F9F9F9" },
      ]}
    >
      <TouchableOpacity
                    onPress={() => router.push(`../TestNotifications`)}
                  >
                    <Text style={[
          styles.title,
          { color: colorScheme === "dark" ? "#FFFFFF" : "#000000" },
        ]}>
                      Probar Notis
                    </Text>
                  </TouchableOpacity>
      <Text
        style={[
          styles.title,
          { color: colorScheme === "dark" ? "#FFFFFF" : "#000000" },
        ]}
      >
        Menú de Administrador
      </Text>
      {/* Botones de Filtro */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: colorScheme === "dark" ? "#761FE0" : "#007BFF" },
          ]}
          onPress={() => filterUsersByRole("all")}
        >
          <Text style={styles.filterText}>Todos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: colorScheme === "dark" ? "#761FE0" : "#007BFF" },
          ]}
          onPress={() => filterUsersByRole("Admin")}
        >
          <Text style={styles.filterText}>Administradores</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: colorScheme === "dark" ? "#761FE0" : "#007BFF" },
          ]}
          onPress={() => filterUsersByRole("Dentist")}
        >
          <Text style={styles.filterText}>Dentistas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: colorScheme === "dark" ? "#761FE0" : "#007BFF" },
          ]}
          onPress={() => filterUsersByRole("Patient")}
        >
          <Text style={styles.filterText}>Pacientes</Text>
        </TouchableOpacity>
      </View>
      {/* Lista de Usuarios */}
      <ScrollView>
        {filteredUsers.map((UserAdmin) => (
          <View key={UserAdmin.id} style={getCardStyle(UserAdmin.rol)}>
            <Text
              style={[
                styles.UserName,
                { color: colorScheme === "dark" ? "#FFFFFF" : "#000000" },
              ]}
            >
              {UserAdmin.name}
            </Text>
            <Text
              style={[
                styles.UserEmail,
                { color: colorScheme === "dark" ? "#BBBBBB" : "#555555" },
              ]}
            >
              {UserAdmin.email}
            </Text>
            <Text
              style={[
                styles.UserRole,
                { color: colorScheme === "dark" ? "#AAAAAA" : "#888888" },
              ]}
            >
              Rol: {UserAdmin.rol}
            </Text>
            <Text
              style={[
                styles.UserState,
                { color: colorScheme === "dark" ? "#CCCCCC" : "#333333" },
              ]}
            >
              Estado: {UserAdmin.state}
            </Text>
            <TouchableOpacity
              style={styles.changeStateButton}
              onPress={() => changeUserState(UserAdmin.id, UserAdmin.state ?? "Activo")}
            >
              <Text style={styles.changeStateButtonText}>Cambiar Estado</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
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
    textAlign: "center",
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
  },
  filterButton: {
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  filterText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  UserState: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8,
  },
  UserCard: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  UserName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  UserEmail: {
    fontSize: 14,
  },
  UserRole: {
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 5,
  },changeStateButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  changeStateButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});

export default MenuAdmin;