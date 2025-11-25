import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Participants
const participants = [
  { id: '1', name: 'Paula' },
  { id: '2', name: 'Catalina' },
  { id: '3', name: 'Brandon' },
  { id: '4', name: 'Pilar' },
  { id: '5', name: 'Rodolfo' },
  { id: '6', name: 'Marcelo' },
  { id: '7', name: 'Tatiana' },
  { id: '8', name: 'Alfredo' },
  { id: '9', name: 'Felipe' },
  { id: '10', name: 'Tata' },
  { id: '11', name: 'Tita' },
  { id: '12', name: 'Daniela' },
  { id: '13', name: 'Tito Hector' },
  { id: '14', name: 'Rafa' },
  { id: '15', name: 'Victoria' },
];

// Helper function to generate random secret friend assignments with extra randomness
function generateRandomAssignments() {
  const ids = participants.map(p => p.id);
  let assigned: string[] = [];
  let attempts = 0;
  const maxAttempts = 100;
  
  // Add extra randomness sources
  const randomSeed = Date.now() + Math.random() * 10000 + Math.floor(Math.random() * 1000000);
  console.log('🎲 Random seed for this generation:', randomSeed);
  
  // Keep trying until we get a valid assignment (no one has themselves)
  while (attempts < maxAttempts) {
    assigned = [...ids];
    
    // Multiple shuffles with different approaches for maximum randomness
    // Shuffle 1: Fisher-Yates with extra randomness
    for (let i = assigned.length - 1; i > 0; i--) {
      const j = Math.floor((Math.random() + Math.sin(randomSeed + i) + 1) / 2 * (i + 1));
      [assigned[i], assigned[j % assigned.length]] = [assigned[j % assigned.length], assigned[i]];
    }
    
    // Shuffle 2: Additional random swaps
    for (let i = 0; i < assigned.length * 2; i++) {
      const a = Math.floor(Math.random() * assigned.length);
      const b = Math.floor(Math.random() * assigned.length);
      [assigned[a], assigned[b]] = [assigned[b], assigned[a]];
    }
    
    // Shuffle 3: Reverse sections randomly
    if (Math.random() > 0.5) {
      const start = Math.floor(Math.random() * assigned.length / 2);
      const end = start + Math.floor(Math.random() * (assigned.length - start));
      const section = assigned.slice(start, end).reverse();
      assigned.splice(start, section.length, ...section);
    }
    
    // Check if anyone has themselves
    const isValid = ids.every((id, index) => id !== assigned[index]);
    if (isValid) {
      console.log(`✅ Valid assignment found after ${attempts + 1} attempt(s)`);
      break;
    }
    
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    console.warn('⚠️ Max attempts reached, using best attempt');
  }
  
  // Create assignments array
  const finalAssignments = ids.map((personId, index) => ({
    personId,
    secretFriendId: assigned[index],
  }));
  
  console.log('🎯 Generated assignment pairs:');
  finalAssignments.forEach(({ personId, secretFriendId }) => {
    const person = participants.find(p => p.id === personId)?.name;
    const secretFriend = participants.find(p => p.id === secretFriendId)?.name;
    console.log(`   ${person} → ${secretFriend}`);
  });
  
  return finalAssignments;
}

// Helper function to check and clean wishlist if name doesn't match
async function checkAndCleanWishlistIfNeeded(personId: string) {
  try {
    console.log(`🔍 [DEBUG] Checking wishlist for personId: ${personId}`);
    
    const currentPerson = participants.find(p => p.id === personId);
    if (!currentPerson) {
      console.log(`❌ [DEBUG] Person with ID ${personId} not found in participants`);
      return false;
    }
    
    console.log(`✅ [DEBUG] Found current person: ID=${currentPerson.id}, Name="${currentPerson.name}"`);
    
    const wishlistData = await kv.get(`wishlist-${personId}`);
    console.log(`📋 [DEBUG] Retrieved wishlist data:`, wishlistData);
    
    if (!wishlistData) {
      console.log(`ℹ️ [DEBUG] No wishlist found for ID ${personId}, nothing to clean`);
      return false;
    }
    
    if (!wishlistData.personName) {
      console.log(`⚠️ [DEBUG] Wishlist for ID ${personId} has no personName field, skipping validation`);
      return false;
    }
    
    console.log(`🔍 [DEBUG] Comparing names: saved="${wishlistData.personName}" vs current="${currentPerson.name}"`);
    
    if (wishlistData.personName !== currentPerson.name) {
      console.log(`🚨 [MISMATCH] NAME MISMATCH DETECTED! Deleting wishlist for ID ${personId}`);
      console.log(`   - Saved name: "${wishlistData.personName}"`);
      console.log(`   - Current name: "${currentPerson.name}"`);
      
      return await forceDeleteWishlist(personId);
    } else {
      console.log(`✅ [DEBUG] Names match, keeping wishlist for ID ${personId}`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ [DEBUG] Error checking wishlist for ID ${personId}:`, error);
    return false;
  }
}

// Direct function to delete a wishlist
async function forceDeleteWishlist(personId: string) {
  try {
    console.log(`🗑️ [DELETE] Force deleting wishlist for ID ${personId}`);
    
    const wishlistKey = `wishlist-${personId}`;
    
    // Use the proper delete method from KV store
    await kv.del(wishlistKey);
    console.log(`🗑️ [DELETE] Used kv.del() to delete key: ${wishlistKey}`);
    
    // Wait a moment and verify deletion
    await new Promise(resolve => setTimeout(resolve, 100));
    const verifyData = await kv.get(wishlistKey);
    console.log(`✅ [DELETE] Verification - wishlist after deletion:`, verifyData);
    
    const wasDeleted = verifyData === null || verifyData === undefined;
    if (wasDeleted) {
      console.log(`🎉 [DELETE] Successfully deleted wishlist for ID ${personId}`);
    } else {
      console.log(`❌ [DELETE] Failed to delete wishlist for ID ${personId}, data still exists:`, verifyData);
    }
    
    return wasDeleted;
  } catch (error) {
    console.error(`❌ [DELETE] Error deleting wishlist for ID ${personId}:`, error);
    return false;
  }
}

// Initialize assignments on server startup
async function initializeAssignments() {
  try {
    console.log('🚀 Initializing Santa Secreto - FRESH SERVER STARTUP...');
    console.log('📋 Total participants:', participants.length);
    console.log('👥 Participant list:', participants.map(p => `${p.id}: ${p.name}`).join(', '));
    
    // Check if participant ID-name mapping has changed
    const savedParticipants = await kv.get("participants-id-name-mapping");
    const currentParticipants = participants.map(p => ({ id: p.id, name: p.name }));
    
    let shouldClearWishlists = false;
    
    if (!savedParticipants) {
      console.log('🆕 First time setup - no previous participant mapping found');
      shouldClearWishlists = true;
    } else {
      // Check if any ID now has a different name
      for (const current of currentParticipants) {
        const saved = savedParticipants.find(p => p.id === current.id);
        if (saved && saved.name !== current.name) {
          console.log(`🔄 ID ${current.id} changed from "${saved.name}" to "${current.name}"`);
          shouldClearWishlists = true;
          break;
        }
      }
      
      // Check if any ID was removed or added
      const currentIds = currentParticipants.map(p => p.id).sort();
      const savedIds = savedParticipants.map(p => p.id).sort();
      if (JSON.stringify(currentIds) !== JSON.stringify(savedIds)) {
        console.log('🔄 Participant IDs changed (added/removed)');
        shouldClearWishlists = true;
      }
    }
    
    if (shouldClearWishlists) {
      console.log('🧹 Clearing ALL wishlists due to participant changes...');
      
      // Clear wishlists for both old and new participant IDs
      if (savedParticipants) {
        for (const participant of savedParticipants) {
          await kv.set(`wishlist-${participant.id}`, null);
          console.log(`   - Cleared wishlist for old ID ${participant.id} (${participant.name})`);
        }
      }
      
      for (const participant of currentParticipants) {
        await kv.set(`wishlist-${participant.id}`, null);
        console.log(`   - Cleared wishlist for current ID ${participant.id} (${participant.name})`);
      }
      
      console.log('✅ All wishlists cleared due to participant mapping changes');
      
      // Save new participant mapping
      await kv.set("participants-id-name-mapping", currentParticipants);
      console.log('💾 Saved new participant ID-name mapping');
    }
    
    // SIEMPRE ejecutar validación individual adicional para detectar cualquier mismatch restante
    console.log('🔍 Ejecutando validación adicional de todos los wishlists...');
    let additionalClearedCount = 0;
    
    for (const participant of currentParticipants) {
      const wasCleared = await checkAndCleanWishlistIfNeeded(participant.id);
      if (wasCleared) {
        additionalClearedCount++;
      }
    }
    
    if (additionalClearedCount > 0) {
      console.log(`🧹 Validación adicional: eliminados ${additionalClearedCount} wishlists con nombres incorrectos`);
    } else {
      console.log('✅ Validación adicional: todos los wishlists tienen nombres correctos');
    }
    
    // ALWAYS clear old assignments and generate NEW assignments on server startup
    console.log('🧹 Clearing old assignments for fresh server session...');
    await kv.set("secret-friend-assignments", null);
    await kv.set("last-generation-time", null);
    
    console.log('🎲 Generating random assignments for this server session...');
    const timestamp = Date.now();
    const assignments = generateRandomAssignments();
    
    console.log('🎯 Generated assignments count:', assignments.length);
    console.log('⏰ Generation timestamp:', new Date(timestamp).toISOString());
    
    // Store assignments that will persist for this server session
    const assignmentsData = { assignments, timestamp };
    await kv.set("secret-friend-assignments", assignmentsData);
    await kv.set("last-generation-time", timestamp);
    console.log('💾 Assignments saved for persistent use during this session');
    
    // Log the assignments in a readable format
    console.log('🎄 PERSISTENT Assignment mapping for this server session:');
    assignments.forEach(({ personId, secretFriendId }) => {
      const person = participants.find(p => p.id === personId)?.name;
      const secretFriend = participants.find(p => p.id === secretFriendId)?.name;
      console.log(`  ${person} (${personId}) → ${secretFriend} (${secretFriendId})`);
    });
    
    // Verify what was actually saved
    const savedData = await kv.get("secret-friend-assignments");
    console.log('✅ Verification - saved assignments count:', savedData?.assignments?.length || 0);
    console.log('🎊 Server initialization complete! Assignments will persist for this session.');
    
  } catch (error) {
    console.error("❌ Error initializing assignments:", error);
  }
}

// Initialize assignments when server starts (but don't block if it fails)
initializeAssignments().catch(error => {
  console.error("❌ Initialization failed, will generate on-demand:", error);
});

// Get secret friend assignments (uses saved data from server startup)
app.get("/make-server-252a0d41/assignments", async (c) => {
  try {
    // Get assignments that were generated during server initialization
    const assignmentsData = await kv.get("secret-friend-assignments");
    
    if (!assignmentsData || !assignmentsData.assignments) {
      console.warn('⚠️ No assignments found, generating new ones...');
      // Fallback: generate new assignments if none exist
      const timestamp = Date.now();
      const newAssignments = generateRandomAssignments();
      const newData = { assignments: newAssignments, timestamp };
      
      await kv.set("secret-friend-assignments", newData);
      await kv.set("last-generation-time", timestamp);
      
      console.log('✨ Fallback assignments generated and saved');
      
      return c.json({ 
        assignments: newAssignments,
        timestamp: timestamp,
        generatedAt: new Date(timestamp).toISOString(),
        note: "Fallback assignments generated"
      });
    }
    
    console.log('💾 Using persistent assignments from server startup');
    console.log('🗓️ Assignments were generated at:', new Date(assignmentsData.timestamp).toISOString());
    console.log('👥 Assignment count:', assignmentsData.assignments.length);
    
    return c.json({ 
      assignments: assignmentsData.assignments,
      timestamp: assignmentsData.timestamp,
      generatedAt: new Date(assignmentsData.timestamp).toISOString(),
      note: "Persistent assignments from server startup"
    });
  } catch (error) {
    console.error("Error getting persistent assignments:", error);
    return c.json({ error: "Failed to get assignments" }, 500);
  }
});

// Force regenerate assignments (admin endpoint)
app.post("/make-server-252a0d41/assignments/regenerate", async (c) => {
  try {
    console.log('🔄 Force regenerating assignments...');
    console.log('📋 Participants to assign:', participants.length);
    
    const timestamp = Date.now();
    const newAssignments = generateRandomAssignments();
    const assignmentsData = { assignments: newAssignments, timestamp };
    
    await kv.set("secret-friend-assignments", assignmentsData);
    await kv.set("last-generation-time", timestamp);
    
    console.log("🔄 Force regenerated secret friend assignments:", newAssignments);
    console.log('⏰ Force generation timestamp:', new Date(timestamp).toISOString());
    
    // Log the new assignments in a readable format
    console.log('🎄 New assignment mapping:');
    newAssignments.forEach(({ personId, secretFriendId }) => {
      const person = participants.find(p => p.id === personId)?.name;
      const secretFriend = participants.find(p => p.id === secretFriendId)?.name;
      console.log(`  ${person} (${personId}) → ${secretFriend} (${secretFriendId})`);
    });
    
    return c.json({ 
      success: true, 
      message: "New assignments generated successfully",
      totalParticipants: participants.length,
      assignmentsCount: newAssignments.length,
      assignments: newAssignments,
      timestamp,
      generatedAt: new Date(timestamp).toISOString()
    });
  } catch (error) {
    console.error("❌ Error regenerating assignments:", error);
    return c.json({ error: "Failed to regenerate assignments" }, 500);
  }
});

// Debug endpoint to check current assignments
app.get("/make-server-252a0d41/assignments/debug", async (c) => {
  try {
    const assignmentsData = await kv.get("secret-friend-assignments");
    const lastGenTime = await kv.get("last-generation-time");
    const savedParticipants = await kv.get("participants-order");
    const participantsList = participants;
    
    const assignments = assignmentsData?.assignments || [];
    const timestamp = assignmentsData?.timestamp || lastGenTime;
    
    // Check if participant order has changed
    const currentParticipants = participants.map(p => ({ id: p.id, name: p.name }));
    const participantsChanged = !savedParticipants || 
      JSON.stringify(savedParticipants) !== JSON.stringify(currentParticipants);
    
    return c.json({ 
      totalParticipants: participantsList.length,
      participants: participantsList,
      assignmentsCount: assignments.length,
      assignments: assignments,
      timestamp: new Date().toISOString(),
      lastGenerated: timestamp ? new Date(timestamp).toISOString() : 'Never',
      participantOrder: {
        current: currentParticipants,
        saved: savedParticipants,
        hasChanged: participantsChanged,
        note: participantsChanged ? 'Wishlists will be cleared on next server start' : 'Participant order stable'
      },
      dataStructure: {
        hasTimestamp: !!assignmentsData?.timestamp,
        isNewFormat: !!assignmentsData?.assignments
      }
    });
  } catch (error) {
    console.error("❌ Error in debug endpoint:", error);
    return c.json({ error: "Failed to get debug info" }, 500);
  }
});

// Get wishlist for a person
app.get("/make-server-252a0d41/wishlist/:personId", async (c) => {
  try {
    const personId = c.req.param("personId");
    
    // Get current person info from participants
    const currentPerson = participants.find(p => p.id === personId);
    if (!currentPerson) {
      return c.json({ error: "Person not found" }, 404);
    }
    
    // Check and clean this specific wishlist if name doesn't match
    const wasCleared = await checkAndCleanWishlistIfNeeded(personId);
    
    if (wasCleared) {
      console.log(`🧹 Wishlist for ID ${personId} was cleared due to name mismatch`);
      return c.json({ 
        gifts: [], 
        wasCleared: true,
        message: `Wishlist deleted - name mismatch detected`,
        personId: currentPerson.id,
        personName: currentPerson.name
      });
    }
    
    // Get wishlist data after validation
    const wishlistData = await kv.get(`wishlist-${personId}`);
    console.log(`🔍 Retrieved wishlist for ID ${personId}:`, wishlistData);
    
    // Return wishlist or empty array if none exists
    return c.json({ 
      gifts: wishlistData?.gifts || [], 
      wasCleared: false,
      personId: currentPerson.id,
      personName: currentPerson.name
    });
    
  } catch (error) {
    console.error("Error getting wishlist:", error);
    return c.json({ error: "Failed to get wishlist" }, 500);
  }
});

// Save wishlist for a person
app.post("/make-server-252a0d41/wishlist/:personId", async (c) => {
  try {
    const personId = c.req.param("personId");
    const { gifts } = await c.req.json();
    
    // Get current person info
    const currentPerson = participants.find(p => p.id === personId);
    if (!currentPerson) {
      return c.json({ error: "Person not found" }, 404);
    }
    
    // Check and clean this specific wishlist if name doesn't match
    const wasCleared = await checkAndCleanWishlistIfNeeded(personId);
    
    if (wasCleared) {
      console.log('🧹 Wishlist was cleared due to name mismatch - proceeding to save new wishlist');
    }
    
    // Save wishlist with person identification
    const wishlistData = {
      personId: currentPerson.id,
      personName: currentPerson.name,
      gifts: gifts,
      savedAt: new Date().toISOString()
    };
    
    await kv.set(`wishlist-${personId}`, wishlistData);
    
    console.log(`💾 Saved wishlist for ${currentPerson.name} (ID: ${currentPerson.id})`);
    
    return c.json({ success: true, wasCleared, savedData: wishlistData });
  } catch (error) {
    console.error("Error saving wishlist:", error);
    return c.json({ error: "Failed to save wishlist" }, 500);
  }
});

// Health check endpoint
app.get("/make-server-252a0d41/health", (c) => {
  return c.json({ status: "ok" });
});

// Debug endpoint for participant mapping
app.get("/make-server-252a0d41/debug/participants", async (c) => {
  try {
    const savedMapping = await kv.get("participants-id-name-mapping");
    const currentParticipants = participants.map(p => ({ id: p.id, name: p.name }));
    
    return c.json({
      savedMapping: savedMapping || null,
      currentParticipants,
      mappingExists: !!savedMapping,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in debug participants:", error);
    return c.json({ error: "Failed to get debug info" }, 500);
  }
});

// Force clear all wishlists endpoint
app.post("/make-server-252a0d41/debug/clear-wishlists", async (c) => {
  try {
    console.log('🧹 Force clearing ALL wishlists...');
    
    // Clear wishlists for all current participants
    for (const participant of participants) {
      await forceDeleteWishlist(participant.id);
      console.log(`   - Cleared wishlist for ID ${participant.id} (${participant.name})`);
    }
    
    // Update the mapping
    const currentParticipants = participants.map(p => ({ id: p.id, name: p.name }));
    await kv.set("participants-id-name-mapping", currentParticipants);
    
    return c.json({ 
      success: true, 
      message: "All wishlists cleared and mapping updated",
      clearedCount: participants.length,
      newMapping: currentParticipants
    });
  } catch (error) {
    console.error("Error clearing wishlists:", error);
    return c.json({ error: "Failed to clear wishlists" }, 500);
  }
});

// Direct endpoint to delete a specific wishlist
app.post("/make-server-252a0d41/debug/delete-wishlist/:personId", async (c) => {
  try {
    const personId = c.req.param("personId");
    console.log(`🗑️ [API] Direct delete request for wishlist ID: ${personId}`);
    
    const wasDeleted = await forceDeleteWishlist(personId);
    
    return c.json({ 
      success: true, 
      personId,
      wasDeleted,
      message: wasDeleted ? "Wishlist deleted successfully" : "Failed to delete wishlist"
    });
  } catch (error) {
    console.error("Error deleting specific wishlist:", error);
    return c.json({ error: "Failed to delete wishlist" }, 500);
  }
});

// Debug endpoint to test individual wishlist validation
app.post("/make-server-252a0d41/debug/check-wishlist/:personId", async (c) => {
  try {
    const personId = c.req.param("personId");
    console.log(`🧪 [DEBUG TEST] Testing wishlist validation for personId: ${personId}`);
    
    const wasCleared = await checkAndCleanWishlistIfNeeded(personId);
    
    return c.json({ 
      success: true, 
      personId,
      wasCleared,
      message: wasCleared ? "Wishlist was cleared due to name mismatch" : "No action needed - names match or no wishlist found"
    });
  } catch (error) {
    console.error("Error testing wishlist validation:", error);
    return c.json({ error: "Failed to test wishlist validation" }, 500);
  }
});

// Debug endpoint to test all wishlists validation
app.post("/make-server-252a0d41/debug/check-all-wishlists", async (c) => {
  try {
    console.log(`🧪 [DEBUG TEST] Testing wishlist validation for ALL participants`);
    
    const results = [];
    for (const participant of participants) {
      const wasCleared = await checkAndCleanWishlistIfNeeded(participant.id);
      results.push({
        personId: participant.id,
        personName: participant.name,
        wasCleared
      });
    }
    
    const clearedCount = results.filter(r => r.wasCleared).length;
    
    return c.json({ 
      success: true, 
      totalChecked: participants.length,
      clearedCount,
      results,
      message: `Checked ${participants.length} wishlists, cleared ${clearedCount}`
    });
  } catch (error) {
    console.error("Error testing all wishlist validations:", error);
    return c.json({ error: "Failed to test all wishlist validations" }, 500);
  }
});

Deno.serve(app.fetch);