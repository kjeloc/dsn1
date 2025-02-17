import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { db } from "../config/firebaseConfig";
import { collection, addDoc, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useLocalSearchParams } from 'expo-router';

interface WorkgroupFormData {
    groupName: string;
    ownerEmail: string;
    adminEmails: string[];
    memberEmails: string[];
    }

const CreateWorkgroupScreen: React.FC = () => {
  const [searchAdmin, setSearchAdmin] = useState('');
  const [searchMember, setSearchMember] = useState('');
  const [filteredAdmins, setFilteredAdmins] = useState<string[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<string[]>([]);
  const { dentistEmail } = useLocalSearchParams<{ dentistEmail: string }>(); 
  const [formData, setFormData] = useState<WorkgroupFormData>({
    groupName: '',
    ownerEmail: dentistEmail,
    adminEmails: [],
    memberEmails: [],
  });

  const [availableDentists, setAvailableDentists] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDentists = async () => {
      try {
        const q = query(collection(db, 'userTest'), where('rol', '==', 'Dentist'));
        const querySnapshot = await getDocs(q);
        const userList: string[] = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          userList.push(userData.email);
        });
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
    if (!formData[field].includes(email)) {
      handleInputChange(field, [...formData[field], email]);
    }
  };

  const removeEmailFromArray = (field: 'adminEmails' | 'memberEmails', email: string) => {
    handleInputChange(field, formData[field].filter(e => e !== email));
  };

  const handleSubmit = async () => {
    // Lógica para guardar el grupo en Firebase
    try {
      const newWorkgroupRef = await addDoc(collection(db, 'workgroups'), formData);
      console.log('Workgroup added with ID: ', newWorkgroupRef.id);
    } catch (error) {
      console.error('Error adding workgroup: ', error);
    }
  };

  const filterAdmins = (text: string) => {
    setSearchAdmin(text);
    const filtered = availableDentists.filter(dentist =>
      dentist.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredAdmins(filtered);
  };

  const filterMembers = (text: string) => {
    setSearchMember(text);
    const filtered = availableDentists.filter(dentist =>
      dentist.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredMembers(filtered);
  };

  if (loading) {
    return <Text>Cargando...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear Grupo de Trabajo</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre del Grupo"
        value={formData.groupName}
        onChangeText={(text) => handleInputChange('groupName', text)}
      />
      <Text style={styles.label}>Dueño:</Text>
      <Text style={styles.dentistItem}>{dentistEmail}</Text>


      <TextInput
  style={styles.searchInput}
  placeholder="Buscar administrador..."
  value={searchAdmin}
  onChangeText={filterAdmins}
/>
<FlatList
  data={filteredAdmins}
  keyExtractor={(item) => item}
  renderItem={({ item }) => (
    <TouchableOpacity
      style={[
        styles.dentistItem,
        formData.adminEmails.includes(item) && styles.selectedItem,
      ]}
      onPress={() => {
        formData.adminEmails.includes(item)
          ? removeEmailFromArray('adminEmails', item)
          : addEmailToArray('adminEmails', item);
      }}
    >
      <Text>{item}</Text>
    </TouchableOpacity>
  )}
/>

<TextInput
  style={styles.searchInput}
  placeholder="Buscar miembro..."
  value={searchMember}
  onChangeText={filterMembers}
/>
<FlatList
  data={filteredMembers}
  keyExtractor={(item) => item}
  renderItem={({ item }) => (
    <TouchableOpacity
      style={[
        styles.dentistItem,
        formData.memberEmails.includes(item) && styles.selectedItem,
      ]}
      onPress={() => {
        formData.memberEmails.includes(item)
          ? removeEmailFromArray('memberEmails', item)
          : addEmailToArray('memberEmails', item);
      }}
    >
      <Text>{item}</Text>
    </TouchableOpacity>
  )}
/>

      <Button title="Crear Grupo" onPress={handleSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
  dentistItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedItem: {
    backgroundColor: '#e0f7fa',
  },
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