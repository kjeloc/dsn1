import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, useColorScheme
} from 'react-native';
import { db } from "../../../config/firebaseConfig";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { useLocalSearchParams } from 'expo-router';
import { WorkgroupFormData } from "../../utils/types";

const CreateWorkgroupScreen: React.FC = () => {
  const { dentistEmail } = useLocalSearchParams<{ dentistEmail: string }>();
  const [searchAdmin, setSearchAdmin] = useState('');
  const [searchMember, setSearchMember] = useState('');
  const [filteredAdmins, setFilteredAdmins] = useState<string[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<string[]>([]);
  const [availableDentists, setAvailableDentists] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<WorkgroupFormData>({
    groupName: '',
    ownerEmail: dentistEmail,
    adminEmails: [dentistEmail], // El dueño es automáticamente administrador
    memberEmails: [dentistEmail], // El dueño es automáticamente miembro
  });
  const colorScheme = useColorScheme(); // Detectar el esquema de color del dispositivo

  useEffect(() => {
    const fetchDentists = async () => {
      try {
        const q = query(collection(db, 'userTest'), where('rol', '==', 'Dentist'));
        const querySnapshot = await getDocs(q);
        const userList: string[] = querySnapshot.docs.map(doc => doc.data().email);
        setAvailableDentists(userList);
        setFilteredMembers(userList);
        setFilteredAdmins(userList);
      } catch (error) {
        console.error('Error fetching dentists:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDentists();
  }, []);

  const handleInputChange = (field: keyof WorkgroupFormData, value: string | string[]) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const addEmailToArray = (field: 'adminEmails' | 'memberEmails', email: string) => {
    if (field === 'adminEmails') {
      // Solo agregar como admin si ya es miembro
      if (!formData.memberEmails.includes(email)) {
        alert('Para ser administrador, primero debe ser miembro.');
        return;
      }
    }
    if (!formData[field].includes(email)) {
      handleInputChange(field, [...formData[field], email]);
    }
  };

  const removeEmailFromArray = (field: 'adminEmails' | 'memberEmails', email: string) => {
    if (email === dentistEmail) {
      alert('No puedes remover al dueño del grupo.');
      return;
    }
    if (field === 'memberEmails') {
      // Si removemos a un miembro, también se debe eliminar de administradores
      const updatedMembers = formData.memberEmails.filter(e => e !== email);
      const updatedAdmins = formData.adminEmails.filter(e => e !== email);
      setFormData({
        ...formData,
        memberEmails: updatedMembers,
        adminEmails: updatedAdmins,
      });
    } else {
      // Remover de administradores sin afectar miembros
      handleInputChange(field, formData[field].filter(e => e !== email));
    }
  };

  const handleSubmit = async () => {
    try {
      const newWorkgroupRef = await addDoc(collection(db, 'workgroups'), formData);
      console.log('Workgroup added with ID: ', newWorkgroupRef.id);
    } catch (error) {
      console.error('Error adding workgroup: ', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#121212' : '#F9F9F9' }]}>
        <Text style={{ color: colorScheme === 'dark' ? '#fff' : '#000' }}>Cargando...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#121212' : '#F9F9F9' }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <Text style={[styles.title, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>Crear Grupo de Trabajo</Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colorScheme === 'dark' ? '#444' : '#ccc',
                backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#FFF',
                color: colorScheme === 'dark' ? '#fff' : '#000',
              },
            ]}
            placeholder="Nombre del Grupo"
            placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#888'}
            value={formData.groupName}
            onChangeText={(text) => handleInputChange('groupName', text)}
          />
          <Text style={[styles.label, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>Dueño:</Text>
          <Text style={[styles.owner, { backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#f0f0f0', color: colorScheme === 'dark' ? '#fff' : '#000' }]}>{dentistEmail}</Text>
          <TextInput
            style={[
              styles.searchInput,
              {
                borderColor: colorScheme === 'dark' ? '#444' : '#ccc',
                backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#f9f9f9',
                color: colorScheme === 'dark' ? '#fff' : '#000',
              },
            ]}
            placeholder="Buscar miembro..."
            placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#888'}
            value={searchMember}
            onChangeText={setSearchMember}
          />
          <FlatList
            data={filteredMembers}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.dentistItem,
                  formData.memberEmails.includes(item) && styles.selectedItem,
                  { borderColor: colorScheme === 'dark' ? '#444' : '#eee', backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#FFF' },
                ]}
                onPress={() => {
                  formData.memberEmails.includes(item)
                    ? removeEmailFromArray('memberEmails', item)
                    : addEmailToArray('memberEmails', item);
                }}
                disabled={item === dentistEmail} // El dueño no se puede eliminar
              >
                <Text style={{ color: colorScheme === 'dark' ? '#fff' : '#000' }}>
                  {item} {item === dentistEmail ? '(Dueño)' : ''}
                </Text>
              </TouchableOpacity>
            )}
          />
          <TextInput
            style={[
              styles.searchInput,
              {
                borderColor: colorScheme === 'dark' ? '#444' : '#ccc',
                backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#f9f9f9',
                color: colorScheme === 'dark' ? '#fff' : '#000',
              },
            ]}
            placeholder="Buscar administrador..."
            placeholderTextColor={colorScheme === 'dark' ? '#aaa' : '#888'}
            value={searchAdmin}
            onChangeText={setSearchAdmin}
          />
          <FlatList
            data={filteredAdmins}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.dentistItem,
                  formData.adminEmails.includes(item) && styles.selectedItem,
                  { borderColor: colorScheme === 'dark' ? '#444' : '#eee', backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#FFF' },
                ]}
                onPress={() => {
                  formData.adminEmails.includes(item)
                    ? removeEmailFromArray('adminEmails', item)
                    : addEmailToArray('adminEmails', item);
                }}
                disabled={item === dentistEmail} // El dueño no se puede remover
              >
                <Text style={{ color: colorScheme === 'dark' ? '#fff' : '#000' }}>
                  {item} {item === dentistEmail ? '(Dueño)' : ''}
                </Text>
              </TouchableOpacity>
            )}
          />
          {/* Botón personalizado */}
          <TouchableOpacity
            style={[
              styles.customButton,
              { backgroundColor: colorScheme === 'dark' ? '#761FE0' : '#007BFF' },
            ]}
            onPress={handleSubmit}
          >
            <Text style={styles.buttonText}>Crear Grupo</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, padding: 16, justifyContent: "space-between" },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  input: { height: 40, borderWidth: 1, marginBottom: 12, paddingHorizontal: 8, borderRadius: 8 },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 16 },
  owner: { padding: 12, marginBottom: 12, borderRadius: 8 },
  listContainer: { flexGrow: 1 },
  dentistItem: { padding: 12, borderBottomWidth: 1, borderRadius: 8 },
  selectedItem: { backgroundColor: '#e0f7fa' },
  customButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
});

export default CreateWorkgroupScreen;