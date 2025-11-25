import { supabaseAdmin } from './supabase';

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

const TABLE_NAME = 'kv_store_252a0d41';

// Helper function to generate family key
function getFamilyKey(code: string): string {
  return `family:${code}`;
}

// Create new family
export async function createFamily(familyData: Omit<FamilyData, 'participants' | 'assignments' | 'wishlist'>): Promise<boolean> {
  try {
    const familyKey = getFamilyKey(familyData.code);
    
    // Check if already exists
    const { data: existing } = await supabaseAdmin
      .from(TABLE_NAME)
      .select('value')
      .eq('key', familyKey)
      .maybeSingle();
    
    if (existing) {
      console.log(`❌ Family ${familyData.code} already exists`);
      return false;
    }

    const fullFamilyData: FamilyData = {
      ...familyData,
      participants: [],
      assignments: [],
      wishlist: [],
    };

    const { error } = await supabaseAdmin
      .from(TABLE_NAME)
      .insert({
        key: familyKey,
        value: fullFamilyData
      });

    if (error) {
      console.error('Error creating family in Supabase:', error);
      return false;
    }

    console.log(`✅ Created family ${familyData.code} in Supabase`);
    return true;
  } catch (error) {
    console.error('Error creating family:', error);
    return false;
  }
}

// Get family by code
export async function getFamily(code: string): Promise<FamilyData | null> {
  try {
    const familyKey = getFamilyKey(code);
    
    const { data, error } = await supabaseAdmin
      .from(TABLE_NAME)
      .select('value')
      .eq('key', familyKey)
      .maybeSingle();

    if (error) {
      console.error('Error reading family from Supabase:', error);
      return null;
    }

    return data?.value || null;
  } catch (error) {
    console.error('Error getting family:', error);
    return null;
  }
}

// Update family
export async function updateFamily(code: string, updates: Partial<FamilyData>): Promise<boolean> {
  try {
    const currentData = await getFamily(code);
    if (!currentData) {
      console.log(`❌ Family ${code} not found for update`);
      return false;
    }

    const updatedData = {
      ...currentData,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const familyKey = getFamilyKey(code);
    const { error } = await supabaseAdmin
      .from(TABLE_NAME)
      .update({ value: updatedData })
      .eq('key', familyKey);

    if (error) {
      console.error('Error updating family in Supabase:', error);
      return false;
    }

    console.log(`✅ Updated family ${code} in Supabase`);
    return true;
  } catch (error) {
    console.error('Error updating family:', error);
    return false;
  }
}

// Check if a family exists
export async function familyExists(code: string): Promise<boolean> {
  try {
    const familyKey = getFamilyKey(code);
    
    const { data } = await supabaseAdmin
      .from(TABLE_NAME)
      .select('key')
      .eq('key', familyKey)
      .maybeSingle();

    return !!data;
  } catch (error) {
    console.error('Error checking if family exists:', error);
    return false;
  }
}

// List all families
export async function getAllFamilies(): Promise<FamilyData[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLE_NAME)
      .select('value')
      .like('key', 'family:%');

    if (error) {
      console.error('Error listing families from Supabase:', error);
      return [];
    }

    return data?.map(item => item.value) || [];
  } catch (error) {
    console.error('Error listing families:', error);
    return [];
  }
}

// Delete family
export async function deleteFamily(code: string): Promise<boolean> {
  try {
    const familyKey = getFamilyKey(code);
    
    const { error } = await supabaseAdmin
      .from(TABLE_NAME)
      .delete()
      .eq('key', familyKey);

    if (error) {
      console.error('Error deleting family from Supabase:', error);
      return false;
    }

    console.log(`✅ Deleted family ${code} from Supabase`);
    return true;
  } catch (error) {
    console.error('Error deleting family:', error);
    return false;
  }
}

// Get storage stats for debugging
export async function getStorageStats() {
  try {
    const families = await getAllFamilies();
    return {
      totalFamilies: families.length,
      families: families.map(f => f.code),
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return {
      totalFamilies: 0,
      families: [],
    };
  }
}