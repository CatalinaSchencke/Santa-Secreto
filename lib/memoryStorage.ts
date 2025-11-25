// In-memory storage for families (for production serverless environments)
// Note: Data will be lost when the serverless function restarts, but it's good for demo purposes

export interface FamilyData {
  code: string;
  name: string;
  eventDate: string | null;
  maxBudget: number | null;
  participants: Participant[];
  assignments: Assignment[];
  wishlist: WishlistItem[];
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

// In-memory storage
const familiesStorage = new Map<string, FamilyData>();

// Initialize with some default data for testing
if (familiesStorage.size === 0) {
  // Add Familia Perez as a default family for backward compatibility
  const defaultFamily: FamilyData = {
    code: 'PEREZ',
    name: 'Familia Perez Rojel',
    eventDate: '2024-12-24',
    maxBudget: 30000,
    participants: [],
    assignments: [],
    wishlist: [],
    createdAt: new Date().toISOString(),
  };
  familiesStorage.set('PEREZ', defaultFamily);
}

// Create new family
export function createFamily(familyData: Omit<FamilyData, 'participants' | 'assignments' | 'wishlist'>): boolean {
  try {
    // Check if already exists
    if (familiesStorage.has(familyData.code)) {
      return false;
    }

    const fullFamilyData: FamilyData = {
      ...familyData,
      participants: [],
      assignments: [],
      wishlist: [],
    };

    familiesStorage.set(familyData.code, fullFamilyData);
    console.log(`✅ Created family ${familyData.code} in memory`);
    return true;
  } catch (error) {
    console.error('Error creating family in memory:', error);
    return false;
  }
}

// Get family by code
export function getFamily(code: string): FamilyData | null {
  try {
    return familiesStorage.get(code) || null;
  } catch (error) {
    console.error('Error reading family from memory:', error);
    return null;
  }
}

// Update family
export function updateFamily(code: string, updates: Partial<FamilyData>): boolean {
  try {
    const currentData = familiesStorage.get(code);
    if (!currentData) {
      return false;
    }

    const updatedData = {
      ...currentData,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    familiesStorage.set(code, updatedData);
    console.log(`✅ Updated family ${code} in memory`);
    return true;
  } catch (error) {
    console.error('Error updating family in memory:', error);
    return false;
  }
}

// Check if a family exists
export function familyExists(code: string): boolean {
  return familiesStorage.has(code);
}

// List all families
export function getAllFamilies(): FamilyData[] {
  try {
    return Array.from(familiesStorage.values());
  } catch (error) {
    console.error('Error listing families from memory:', error);
    return [];
  }
}

// Delete family
export function deleteFamily(code: string): boolean {
  try {
    const deleted = familiesStorage.delete(code);
    if (deleted) {
      console.log(`✅ Deleted family ${code} from memory`);
    }
    return deleted;
  } catch (error) {
    console.error('Error deleting family from memory:', error);
    return false;
  }
}

// Get current storage stats (for debugging)
export function getStorageStats() {
  return {
    totalFamilies: familiesStorage.size,
    families: Array.from(familiesStorage.keys()),
  };
}