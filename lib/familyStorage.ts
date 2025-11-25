// Mock storage para desarrollo - en producción sería Supabase
export const familyStorage = new Map<string, any>();

// Tipos para TypeScript
export interface FamilyInfo {
  code: string;
  name: string;
  eventDate: string | null;
  maxBudget: number | null;
  participants: any[];
  assignments: any[];
  wishlist: any[];
  createdAt: string;
  updatedAt?: string;
}

export interface Participant {
  id: number;
  name: string;
  addedAt: string;
}

export interface Assignment {
  giver: string;
  receiver: string;
  assignedAt: string;
}

export interface WishlistItem {
  id: number;
  participantId: number;
  item: string;
  addedAt: string;
}