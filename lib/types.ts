export type Species = 'Canine' | 'Feline' | 'Equine' | 'Bovine' | 'Avian' | 'Exotic' | 'Other';

export type AIStatus = 'pending' | 'processing' | 'complete' | 'failed';

export interface Patient {
  id: string;
  name: string;
  species: Species;
  breed: string;
  age: number; // in years
  age_months: number; // remainder in months
  weight: number; // lbs
  owner: string;
  ownerPhone?: string;
  lastVisit: string;
  status: 'Active' | 'Archived';
  image: string; // emoji or url
  allergies?: string[];
  medications?: string[];
  historySummary?: string;
  // AI Profile fields
  aiStatus?: AIStatus;
  aiConfidence?: number; // 0-100
  aiGeneratedAt?: string; // ISO string
}

export interface SoapNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export type ConsultationStatus = 'scheduled' | 'in-progress' | 'completed';

export interface Consultation {
  id: string;
  patientId: string;
  patientName?: string;
  patientImage?: string;
  date: string; // ISO string
  status: ConsultationStatus;
  transcript: string;
  soap: SoapNote;
  soapPreview?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  structure: string; // Simple placeholder for template structure
}

export interface PatientDocument {
  id: string;
  patientId: string;
  name: string;
  type: string; // 'pdf' | 'image' | etc
  size: string;
  uploadDate: string;
  url?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: string;
  avatar?: string;
  message: string;
  time: string;
  timestamp: number;
  reactions?: string[];
}

export interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  lastTime: string;
  avatar?: string;
  unreadCount: number;
  type: 'channel' | 'direct';
  pinned?: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  ownerName: string;
  date: string; // ISO string
  time: string; // HH:mm
  duration: string; // e.g. "30 min"
  classification: string; // e.g. "Checkup", "Emergency"
  note: string;
  vector: 'clinic' | 'telehealth';
  status: 'confirmed' | 'pending' | 'urgent' | 'cancelled';
  createdAt: any;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: any;
}

