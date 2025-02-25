  import React, { useEffect, useState } from "react";
  import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, } from "react-native";
  import { UserAdmin } from "../utils/types";
  import { fetchUsers } from "../utils/firebaseService";
  const MenuAdmin: React.FC = () => {
    const [Users, setUsers] = useState<UserAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [filteredUsers, setFilteredUsers] = useState<UserAdmin[]>([]);

    useEffect(() => {
      const loadUsers = async () => {
        try {
          const userList = await fetchUsers();
          setUsers(userList);
          setFilteredUsers(userList);
        } catch (error) {
          console.error("Error al cargar los usuarios:", error);
        } finally {
          setLoading(false);
        }
      };
  
      loadUsers();
    }, []);

    const filterUsersByRole = (role: string) => {
      if (role === "all") {
        setFilteredUsers(Users);
      } else {
        setFilteredUsers(Users.filter((UserAdmin) => UserAdmin.rol === role));
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
        {filteredUsers.map((UserAdmin) => (
          <View key={UserAdmin.id} style={[styles.UserCard, getCardStyle(UserAdmin.rol)]}>
            <Text style={styles.UserName}>{UserAdmin.name}</Text>
            <Text style={styles.UserEmail}>{UserAdmin.email}</Text>
            <Text style={styles.UserRole}>{UserAdmin.rol}</Text>
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
  UserCard: {
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
  UserName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  UserEmail: {
    fontSize: 14,
    color: "#555555",
  },
  UserRole: {
    fontSize: 14,
    fontStyle: "italic",
  },
});

export default MenuAdmin;
