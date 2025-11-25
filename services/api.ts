import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Gift, SecretFriendAssignment } from '../data/mockData';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-252a0d41`;

// Log the configuration for debugging
console.log('🔧 Supabase Configuration:');
console.log('  Project ID:', projectId);
console.log('  API Base URL:', API_BASE);
console.log('  Public Key:', publicAnonKey ? 'Set' : 'Missing');

// Test endpoint to verify Supabase function is working
export async function testConnection(): Promise<boolean> {
  const url = `${API_BASE}/health`;
  console.log('🩺 Testing connection to:', url);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('🩺 Health check status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Supabase function is working:', data);
      return true;
    } else {
      console.warn('⚠️ Health check failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
}

// Get or initialize secret friend assignments
export async function getAssignments(): Promise<SecretFriendAssignment[]> {
  const url = `${API_BASE}/assignments`;
  console.log('🌐 Making request to:', url);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`Failed to get assignments: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ API Response data:', data);
    
    // Handle both old and new format
    let assignments;
    if (data.assignments) {
      assignments = data.assignments;
      if (data.generatedAt) {
        console.log('🕒 Assignments generated at:', data.generatedAt);
      }
    } else {
      throw new Error('No assignments field in response');
    }
    
    console.log('🎯 Final assignments to return:', assignments);
    return assignments;
  } catch (error) {
    console.error('💥 Error fetching assignments:', error);
    
    // Log more details about the error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('🚫 Network error - Supabase function may not be deployed or URL is incorrect');
    }
    
    throw error;
  }
}

// Get wishlist for a person
export async function getWishlist(personId: string): Promise<Gift[]> {
  try {
    const response = await fetch(`${API_BASE}/wishlist/${personId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get wishlist: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.gifts;
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    throw error;
  }
}

// Force regenerate assignments (admin function)
export async function forceRegenerateAssignments(): Promise<any> {
  const url = `${API_BASE}/assignments/regenerate`;
  console.log('🔄 Forcing regeneration at:', url);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('🔄 Regeneration response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Regeneration Error Response:', errorText);
      throw new Error(`Failed to regenerate: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Regeneration successful:', data);
    return data;
  } catch (error) {
    console.error('💥 Error forcing regeneration:', error);
    throw error;
  }
}

// Debug assignments (admin function)
export async function debugAssignments(): Promise<any> {
  const url = `${API_BASE}/assignments/debug`;
  console.log('🔍 Debug request to:', url);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('🔍 Debug response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Debug Error Response:', errorText);
      throw new Error(`Failed to debug: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('🔍 Debug data:', data);
    return data;
  } catch (error) {
    console.error('💥 Error in debug:', error);
    throw error;
  }
}

// Save wishlist for a person
export async function saveWishlist(personId: string, gifts: Gift[]): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/wishlist/${personId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gifts }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save wishlist: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error saving wishlist:', error);
    throw error;
  }
}
