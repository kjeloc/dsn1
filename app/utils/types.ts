// /types.ts
import { Timestamp,} from "firebase/firestore";

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderEmail: string;
  timestamp: Date | Timestamp; 
}

export interface UserAdmin {
    id: string;
    name: string;
    email: string;
    rol: string;
}

export interface Chat {
  id: string;
  participants: string[]; // IDs de los documentos de los usuarios
  participantsEmail: string[]; // Correos electrónicos de los usuarios
}

export interface User {
    name: string;
    rol: "Dentist" | "Patient"; // Cambiado de 'role' a 'rol'
    patients?: string[]; // Solo para odontólogos
    dentist?: string[];    // Solo para pacientes
    email: string;       // Campo adicional
    id: string;          // Campo adicional
    profilePicture?: string; // Campo opcional
    state?: string;      // Campo opcional
  }

  export interface FormDataDentistRegister {
    email: string;
    name: string;
    password: string;
    birthdate: string; // Formato YYYY-MM-DD
    patients: string[]; // Array de correos de pacientes
    dental_office: string[]; // Array de nombres de consultorios
  }

  export interface FormDataUserRegister {
    Pname: string;
    Pemail: string;
    Ppassword: string;
    Pbirthdate: string; // Fecha de nacimiento en formato YYYY-MM-DD
  }

  export interface UserChat {
    name: string;
    rol: "Dentist" | "Patient";
    patients?: string[];
    dentist?: string;
    email: string;
    id?: string; // Hacer el campo opcional para evitar errores
    profilePicture?: string;
    state?: string;
  }

  export interface Appointment {
    id: string;
    patientEmail: string;
    date: string;
    hour: string;
    reason: string;
    dentalOffice: string;
    dentistEmail: string;
  }

  export interface DentistData {
    name: string;
    email: string;
    birthdate: string;
    dental_office: string[];
    patients: string[];
    state: string;
    profilePicture: string;
  }

  export interface Forum {
    id: string;
    title: string;
    type: string;
    category: string;
    content: string;
    author: string;
    date: string;
  }

  export interface Comment {
    id: string;
    comentador: string;
    respuesta: string;
  }

  export interface WorkgroupFormData {
    groupName: string;
    ownerEmail: string;
    adminEmails: string[];
    memberEmails: string[];
  }

  export interface Workgroup {
    name: string;
    owner: string;
    admins: string[];
    members: string[];
    id: string;
  }
  
  export interface PatientData {
    profilePicture: string;
    name: string;
    email: string;
    birthdate: string;
    age?: number;
    appointments: {
      date: string;
      hour: string;
      reason: string;
      dentalOffice: string;
      dentistEmail: string;
    }[];
  }

  export interface UserData {
    name: string;
    email: string;
    age?: number;
  }
  
  export interface WeatherData {
    name: string;
    main: { temp: number };
    weather: { description: string }[];
  }
export default {};