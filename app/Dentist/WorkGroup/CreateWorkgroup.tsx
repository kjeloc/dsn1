import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard
} from 'react-native';
import { fetchDentists, createWorkgroup,} from "../../utils/firebaseService";
import { useLocalSearchParams } from 'expo-router';
import { WorkgroupFormData } from "../../utils/types";

const CreateWorkgroupScreen: React.FC = () => {
  const { dentistEmail } = useLocalSearchParams<{ dentistEmail: string }>();
  const [searchAdmin, setSearchAdmin] = useState("");
  const [searchMember, setSearchMember] = useState("");
  const [filteredAdmins, setFilteredAdmins] = useState<string[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<string[]>([]);
  const [availableDentists, setAvailableDentists] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<WorkgroupFormData>({
    groupName: "",
    ownerEmail: dentistEmail,
    adminEmails: [dentistEmail], // El dueño es automáticamente administrador
    memberEmails: [dentistEmail], // El dueño es automáticamente miembro
  });

  // Cargar odontólogos disponibles
  useEffect(() => {
    const loadDentists = async () => {
      try {
        const dentists = await fetchDentists();
        setAvailableDentists(dentists);
        setFilteredMembers(dentists);
        setFilteredAdmins(dentists);
      } catch (error) {
        console.error("Error al cargar odontólogos:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDentists();
  }, []);

  // Manejar cambios en el formulario
  const handleInputChange = (field: keyof WorkgroupFormData, value: string | string[]) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  // Agregar un correo a una lista (admin o miembro)
  const addEmailToArray = (field: "adminEmails" | "memberEmails", email: string) => {
    if (field === "adminEmails") {
      // Solo agregar como admin si ya es miembro
      if (!formData.memberEmails.includes(email)) {
        alert("Para ser administrador, primero debe ser miembro.");
        return;
      }
    }
    if (!formData[field].includes(email)) {
      handleInputChange(field, [...formData[field], email]);
    }
  };

  // Remover un correo de una lista (admin o miembro)
  const removeEmailFromArray = (field: "adminEmails" | "memberEmails", email: string) => {
    if (email === dentistEmail) {
      alert("No puedes remover al dueño del grupo.");
      return;
    }
    if (field === "memberEmails") {
      // Si removemos a un miembro, también se debe eliminar de administradores
      const updatedMembers = formData.memberEmails.filter((e) => e !== email);
      const updatedAdmins = formData.adminEmails.filter((e) => e !== email);
      setFormData({
        ...formData,
        memberEmails: updatedMembers,
        adminEmails: updatedAdmins,
      });
    } else {
      // Remover de administradores sin afectar miembros
      handleInputChange(field, formData[field].filter((e) => e !== email));
    }
  };

  // Filtrar correos según la búsqueda
  useEffect(() => {
    setFilteredMembers(
      availableDentists.filter((email) =>
        email.toLowerCase().includes(searchMember.toLowerCase())
      )
    );
  }, [searchMember]);

  useEffect(() => {
    setFilteredAdmins(
      availableDentists.filter((email) =>
        email.toLowerCase().includes(searchAdmin.toLowerCase())
      )
    );
  }, [searchAdmin]);

  // Enviar el formulario para crear el grupo
  const handleSubmit = async () => {
    try {
      await createWorkgroup(formData);
      alert("Grupo de trabajo creado exitosamente.");
    } catch (error) {
      console.error("Error al crear el grupo:", error);
      alert("Ocurrió un error al crear el grupo. Por favor, intenta nuevamente.");
    }
  };

  if (loading) {
    return <Text>Cargando...</Text>;
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <Text style={styles.title}>Crear Grupo de Trabajo</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre del Grupo"
            value={formData.groupName}
            onChangeText={(text) => handleInputChange('groupName', text)}
          />
          <Text style={styles.label}>Dueño:</Text>
          <Text style={styles.owner}>{dentistEmail}</Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Buscar miembro..."
            value={searchMember}
            onChangeText={setSearchMember}
          />
          <FlatList
            data={filteredMembers}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.dentistItem, formData.memberEmails.includes(item) && styles.selectedItem]}
                onPress={() => {
                  formData.memberEmails.includes(item)
                    ? removeEmailFromArray('memberEmails', item)
                    : addEmailToArray('memberEmails', item);
                }}
                disabled={item === dentistEmail} // El dueño no se puede eliminar
              >
                <Text>{item} {item === dentistEmail ? '(Dueño)' : ''}</Text>
              </TouchableOpacity>
            )}
          />

          <TextInput
            style={styles.searchInput}
            placeholder="Buscar administrador..."
            value={searchAdmin}
            onChangeText={setSearchAdmin}
          />
          <FlatList
            data={filteredAdmins}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.dentistItem, formData.adminEmails.includes(item) && styles.selectedItem]}
                onPress={() => {
                  formData.adminEmails.includes(item)
                    ? removeEmailFromArray('adminEmails', item)
                    : addEmailToArray('adminEmails', item);
                }}
                disabled={item === dentistEmail} // El dueño no se puede remover
              >
                <Text>{item} {item === dentistEmail ? '(Dueño)' : ''}</Text>
              </TouchableOpacity>
            )}
          />

          <View style={styles.buttonContainer}>
            <Button title="Crear Grupo" onPress={handleSubmit} />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, padding: 16, justifyContent: "space-between" },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  input: { height: 40, borderColor: '#ccc', borderWidth: 1, marginBottom: 12, paddingHorizontal: 8 },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 16 },
  owner: { padding: 12, backgroundColor: '#f0f0f0', marginBottom: 12 },
  listContainer: { flexGrow: 1 },
  dentistItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  selectedItem: { backgroundColor: '#e0f7fa' },
  buttonContainer: { marginBottom: 16 },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    backgroundColor: '#f9f9f9',
  },
});

export default CreateWorkgroupScreen;
