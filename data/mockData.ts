import participantsData from './participants.json';

export interface Participant {
  id: string;
  name: string;
}

export interface Gift {
  id: string;
  name: string;
  link?: string;
  image?: string;
}

export interface SecretFriendAssignment {
  personId: string;
  secretFriendId: string;
}

export interface GiftWishlist {
  personId: string;
  gifts: Gift[];
}

// Load participants from external JSON file
export const participants: Participant[] = participantsData;

// Generate random secret friend assignments for development
function generateLocalAssignments(): SecretFriendAssignment[] {
  const ids = participants.map(p => p.id);
  let assigned: string[] = [];
  let attempts = 0;
  const maxAttempts = 100;
  
  // Keep trying until we get a valid assignment (no one has themselves)
  while (attempts < maxAttempts) {
    assigned = [...ids];
    
    // Fisher-Yates shuffle
    for (let i = assigned.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [assigned[i], assigned[j]] = [assigned[j], assigned[i]];
    }
    
    // Check if anyone has themselves
    const isValid = ids.every((id, index) => id !== assigned[index]);
    if (isValid) break;
    
    attempts++;
  }
  
  // Create assignments array
  return ids.map((personId, index) => ({
    personId,
    secretFriendId: assigned[index],
  }));
}

// Initialize assignments for this session
let localAssignments: SecretFriendAssignment[] | null = null;

function getAssignments(): SecretFriendAssignment[] {
  if (!localAssignments) {
    localAssignments = generateLocalAssignments();
    console.log('🎄 Generated local secret friend assignments:', localAssignments);
    
    // Log assignments in readable format
    localAssignments.forEach(({ personId, secretFriendId }) => {
      const person = participants.find(p => p.id === personId)?.name;
      const secretFriend = participants.find(p => p.id === secretFriendId)?.name;
      console.log(`${person} → ${secretFriend}`);
    });
  }
  return localAssignments;
}

export const getSecretFriend = async (personId: string): Promise<Participant | undefined> => {
  console.log('🔍 Getting secret friend for person ID:', personId);
  
  try {
    // Always try to get assignments from the server first
    const { getAssignments: getAPIAssignments, forceRegenerateAssignments } = await import('../services/api');
    
    console.log('📡 Fetching assignments from server...');
    let assignments;
    
    try {
      assignments = await getAPIAssignments();
      console.log('✅ Received assignments from server:', assignments);
    } catch {
      console.log('⚠️ No assignments found, auto-generating new ones...');
      
      // Auto-generate assignments if none exist (this happens on first deploy/run)
      const result = await forceRegenerateAssignments();
      console.log('🎲 Auto-generated assignments:', result);
      
      // Now fetch the newly generated assignments
      assignments = await getAPIAssignments();
      console.log('✅ Fetched newly generated assignments:', assignments);
    }
    
    if (!Array.isArray(assignments) || assignments.length === 0) {
      console.warn('⚠️ Still no assignments available');
      throw new Error('No assignments available from server');
    }
    
    const assignment = assignments.find(a => a.personId === personId);
    console.log('🎯 Found assignment:', assignment);
    
    if (!assignment) {
      console.warn('⚠️ No assignment found for person ID:', personId);
      return undefined;
    }
    
    const secretFriend = participants.find(p => p.id === assignment.secretFriendId);
    console.log('🎁 Secret friend found:', secretFriend);
    return secretFriend;
    
  } catch (error) {
    console.error('❌ Server connection failed:', error);
    console.warn('🔄 Using temporary local fallback while server initializes...');
    
    // Temporary fallback only if server is completely unavailable
    const assignments = getAssignments();
    console.log('🏠 Temporary local assignments:', assignments);
    
    const assignment = assignments.find(a => a.personId === personId);
    if (!assignment) return undefined;
    return participants.find(p => p.id === assignment.secretFriendId);
  }
};

// Auto-initialize assignments when the app starts (for Vercel deployments)
export const autoInitializeAssignments = async (): Promise<void> => {
  try {
    console.log('🚀 Auto-initializing assignments for production deployment...');
    const { forceRegenerateAssignments } = await import('../services/api');
    
    const result = await forceRegenerateAssignments();
    console.log('✨ Auto-initialization complete:', result);
  } catch (error) {
    console.warn('⚠️ Auto-initialization failed, will generate on-demand:', error);
  }
};

export const getGiftWishlist = async (personId: string): Promise<Gift[]> => {
  try {
    const { getWishlist } = await import('../services/api');
    return await getWishlist(personId);
  } catch (error) {
    console.warn('API not available, using empty wishlist:', error);
    // Return empty wishlist for local development
    return [];
  }
};

export const addGiftsToWishlist = async (personId: string, gifts: Gift[]): Promise<void> => {
  try {
    const { saveWishlist } = await import('../services/api');
    await saveWishlist(personId, gifts);
  } catch (error) {
    console.warn('API not available, gifts saved locally:', error);
    // In development, just log the gifts
    console.log(`Gifts for ${personId}:`, gifts);
  }
};