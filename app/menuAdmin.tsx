// app/menuAdmin.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { db } from "../config/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

interface User {
  id: string;
  name: string;
  email: string;
  rol: string;
}

const MenuAdmin: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "userTest"));
        const userList: User[] = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          userList.push({
            id: doc.id,
            name: userData.name,
            email: userData.email,
            rol: userData.rol,
          });
        });
        setUsers(userList);
        setFilteredUsers(userList);
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
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter((user) => user.rol === role));
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  const getCardStyle = (role: string) => {
    switch (role) {
      case "Admin":
        return styles.adminCard;
      case "Dentist":
        return styles.dentistCard;
      case "Patient":
        return styles.patientCard;
      default:
        return styles.defaultCard;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menú de Administrador</Text>

      {/* Botones de Filtro */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => filterUsersByRole("all")}
        >
          <Text style={styles.filterText}>Todos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => filterUsersByRole("Admin")}
        >
          <Text style={styles.filterText}>Administradores</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => filterUsersByRole("Dentist")}
        >
          <Text style={styles.filterText}>Dentistas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => filterUsersByRole("Patient")}
        >
          <Text style={styles.filterText}>Pacientes</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Usuarios */}
      <ScrollView>
        {filteredUsers.map((user) => (
          <View key={user.id} style={[styles.userCard, getCardStyle(user.rol)]}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userRole}>{user.rol}</Text>
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
    backgroundColor: "#F9F9F9",
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
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 8,
  },
  filterText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  userCard: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  adminCard: {
    backgroundColor: "#D3D3D3", // Gris claro para Admin
  },
  dentistCard: {
    backgroundColor: "#ADD8E6", // Azul claro para Dentist
  },
  patientCard: {
    backgroundColor: "#B0C4DE", // Azul grisáceo para Patient
  },
  defaultCard: {
    backgroundColor: "#FFFFFF",
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  userEmail: {
    fontSize: 14,
    color: "#555555",
  },
  userRole: {
    fontSize: 14,
    fontStyle: "italic",
  },
});

export default MenuAdmin;