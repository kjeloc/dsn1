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

const MenuAdmin: React.FC = () => {
  const [UserAdmins, setUserAdmins] = useState<UserAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredUserAdmins, setFilteredUserAdmins] = useState<UserAdmin[]>([]);
  const colorScheme = useColorScheme(); // Detectar el esquema de color del dispositivo

  useEffect(() => {
    const fetchUserAdmins = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "UserAdminTest"));
        const UserAdminList: UserAdmin[] = [];
        querySnapshot.forEach((doc) => {
          const UserAdminData = doc.data();
          UserAdminList.push({
            id: doc.id,
            name: UserAdminData.name || "Sin nombre",
            email: UserAdminData.email || "Sin correo",
            rol: UserAdminData.rol || "Rol desconocido",
            state: UserAdminData.state || "Activo", // Asignar 'Activo' si no existe el estado
          });
        });
        setUserAdmins(UserAdminList);
        setFilteredUserAdmins(UserAdminList);
      } catch (error) {
        console.error("Error al obtener los usuarios:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserAdmins();
  }, []);

  const filterUserAdminsByRole = (role: string) => {
    if (role === "all") {
      setFilteredUserAdmins(UserAdmins);
    } else {
      setFilteredUserAdmins(UserAdmins.filter((UserAdmin) => UserAdmin.rol === role));
    }
  };

  const changeUserState = async (userId: string, currentState: string) => {
    try {
      // Determinar el nuevo estado
      const states = ["Activo", "Inactivo", "Prueba"];
      const currentIndex = states.indexOf(currentState);
      const newState = states[(currentIndex + 1) % states.length];

      // Actualizar el estado local
      const updatedUserAdmins = UserAdmins.map((user) =>
        user.id === userId ? { ...user, state: newState } : user
      );
      setUserAdmins(updatedUserAdmins);
      setFilteredUserAdmins(updatedUserAdmins);

      // Actualizar el estado en Firestore
      const userDocRef = doc(db, "UserAdminTest", userId);
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
          styles.UserAdminCard,
          { backgroundColor: colorScheme === "dark" ? "#333333" : "#D3D3D3" },
        ];
      case "Dentist":
        return [
          styles.UserAdminCard,
          { backgroundColor: colorScheme === "dark" ? "#2E4053" : "#ADD8E6" },
        ];
      case "Patient":
        return [
          styles.UserAdminCard,
          { backgroundColor: colorScheme === "dark" ? "#34495E" : "#B0C4DE" },
        ];
      default:
        return [
          styles.UserAdminCard,
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
          onPress={() => filterUserAdminsByRole("all")}
        >
          <Text style={styles.filterText}>Todos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: colorScheme === "dark" ? "#761FE0" : "#007BFF" },
          ]}
          onPress={() => filterUserAdminsByRole("Admin")}
        >
          <Text style={styles.filterText}>Administradores</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: colorScheme === "dark" ? "#761FE0" : "#007BFF" },
          ]}
          onPress={() => filterUserAdminsByRole("Dentist")}
        >
          <Text style={styles.filterText}>Dentistas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: colorScheme === "dark" ? "#761FE0" : "#007BFF" },
          ]}
          onPress={() => filterUserAdminsByRole("Patient")}
        >
          <Text style={styles.filterText}>Pacientes</Text>
        </TouchableOpacity>
      </View>
      {/* Lista de Usuarios */}
      <ScrollView>
        {filteredUserAdmins.map((UserAdmin) => (
          <View key={UserAdmin.id} style={getCardStyle(UserAdmin.rol)}>
            <Text
              style={[
                styles.UserAdminName,
                { color: colorScheme === "dark" ? "#FFFFFF" : "#000000" },
              ]}
            >
              {UserAdmin.name}
            </Text>
            <Text
              style={[
                styles.UserAdminEmail,
                { color: colorScheme === "dark" ? "#BBBBBB" : "#555555" },
              ]}
            >
              {UserAdmin.email}
            </Text>
            <Text
              style={[
                styles.UserAdminRole,
                { color: colorScheme === "dark" ? "#AAAAAA" : "#888888" },
              ]}
            >
              Rol: {UserAdmin.rol}
            </Text>
            <Text
              style={[
                styles.UserAdminState,
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
  UserAdminState: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8,
  },
  UserAdminCard: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  UserAdminName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  UserAdminEmail: {
    fontSize: 14,
  },
  UserAdminRole: {
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