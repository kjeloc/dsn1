  import React, { useEffect, useState } from "react";
  import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, } from "react-native";
  import { db } from "../../config/firebaseConfig";
  import { collection, getDocs } from "firebase/firestore";
  import { UserAdmin } from "../utils/types";

  const MenuAdmin: React.FC = () => {
    const [UserAdmins, setUserAdmins] = useState<UserAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [filteredUserAdmins, setFilteredUserAdmins] = useState<UserAdmin[]>([]);

    useEffect(() => {
      const fetchUserAdmins = async () => {
        try {
          const querySnapshot = await getDocs(collection(db, "UserAdminTest"));
          const UserAdminList: UserAdmin[] = [];
          querySnapshot.forEach((doc) => {
            const UserAdminData = doc.data();
            UserAdminList.push({
              id: doc.id,
              name: UserAdminData.name,
              email: UserAdminData.email,
              rol: UserAdminData.rol,
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
          onPress={() => filterUserAdminsByRole("all")}
        >
          <Text style={styles.filterText}>Todos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => filterUserAdminsByRole("Admin")}
        >
          <Text style={styles.filterText}>Administradores</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => filterUserAdminsByRole("Dentist")}
        >
          <Text style={styles.filterText}>Dentistas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => filterUserAdminsByRole("Patient")}
        >
          <Text style={styles.filterText}>Pacientes</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Usuarios */}
      <ScrollView>
        {filteredUserAdmins.map((UserAdmin) => (
          <View key={UserAdmin.id} style={[styles.UserAdminCard, getCardStyle(UserAdmin.rol)]}>
            <Text style={styles.UserAdminName}>{UserAdmin.name}</Text>
            <Text style={styles.UserAdminEmail}>{UserAdmin.email}</Text>
            <Text style={styles.UserAdminRole}>{UserAdmin.rol}</Text>
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
  UserAdminCard: {
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
  UserAdminName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  UserAdminEmail: {
    fontSize: 14,
    color: "#555555",
  },
  UserAdminRole: {
    fontSize: 14,
    fontStyle: "italic",
  },
});

export default MenuAdmin;
