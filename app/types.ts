// /types.ts
export interface Message {
    id: string;
    sender: string;
    text: string;
    timestamp: string;
}

export interface Chat {
    id: string;
    participants: string[];
    messages?: Message[]; // Hacer el campo `messages` opcional
}


// src/types/types.ts
export interface User {
    name: string;
    rol: "Dentist" | "Patient"; // Cambiado de 'role' a 'rol'
    patients?: string[]; // Solo para odontólogos
    dentist?: string;    // Solo para pacientes
    email: string;       // Campo adicional
    id: string;          // Campo adicional
    profilePicture?: string; // Campo opcional
    state?: string;      // Campo opcional
  }
export default {};