import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Use edge functions instead of direct database access to bypass RLS
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

// Helper function to call edge functions
async function callEdgeFunction(functionName: string, data: any) {
  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Edge function error: ${error}`);
  }

  return response.json();
}

// Use the existing kv_store pattern with a namespace
const KV_KEY_PREFIX = 'family:';

export async function createFamily(familyData: Omit<FamilyData, 'participants' | 'assignments' | 'wishlist'>): Promise<boolean> {
  try {
    // Check if already exists using the server edge function
    const existingResponse = await callEdgeFunction('server', {
      action: 'get',
      key: `${KV_KEY_PREFIX}${familyData.code}`,
    });

    if (existingResponse && existingResponse.value) {
      console.log(`❌ Family ${familyData.code} already exists`);
      return false;
    }

    const fullFamilyData: FamilyData = {
      ...familyData,
      participants: [],
      assignments: [],
      wishlist: [],
    };

    // Create family using the server edge function
    await callEdgeFunction('server', {
      action: 'set',
      key: `${KV_KEY_PREFIX}${familyData.code}`,
      value: fullFamilyData,
    });

    console.log(`✅ Created family ${familyData.code} via edge function`);
    return true;
  } catch (error) {
    console.error('Error creating family via edge function:', error);
    return false;
  }
}

export async function getFamily(code: string): Promise<FamilyData | null> {
  try {
    const response = await callEdgeFunction('server', {
      action: 'get',
      key: `${KV_KEY_PREFIX}${code}`,
    });

    return response?.value || null;
  } catch (error) {
    console.error('Error getting family via edge function:', error);
    return null;
  }
}

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

    await callEdgeFunction('server', {
      action: 'set',
      key: `${KV_KEY_PREFIX}${code}`,
      value: updatedData,
    });

    console.log(`✅ Updated family ${code} via edge function`);
    return true;
  } catch (error) {
    console.error('Error updating family via edge function:', error);
    return false;
  }
}

export async function familyExists(code: string): Promise<boolean> {
  try {
    const family = await getFamily(code);
    return !!family;
  } catch (error) {
    console.error('Error checking if family exists:', error);
    return false;
  }
}

export async function getAllFamilies(): Promise<FamilyData[]> {
  try {
    // Get all keys with family prefix using edge function
    const response = await callEdgeFunction('server', {
      action: 'getByPrefix',
      prefix: KV_KEY_PREFIX,
    });

    return response || [];
  } catch (error) {
    console.error('Error listing families via edge function:', error);
    return [];
  }
}

export async function deleteFamily(code: string): Promise<boolean> {
  try {
    await callEdgeFunction('server', {
      action: 'del',
      key: `${KV_KEY_PREFIX}${code}`,
    });

    console.log(`✅ Deleted family ${code} via edge function`);
    return true;
  } catch (error) {
    console.error('Error deleting family via edge function:', error);
    return false;
  }
}

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