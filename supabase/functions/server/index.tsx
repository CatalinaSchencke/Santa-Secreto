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
  { id: '1', name: 'Catalina' },
  { id: '2', name: 'Brandon' },
  { id: '3', name: 'Pilar' },
  { id: '4', name: 'Paula' },
  { id: '5', name: 'Sofía' },
  { id: '6', name: 'Camila' },
  { id: '7', name: 'Valentina' },
  { id: '8', name: 'Martina' },
  { id: '9', name: 'Isabela' },
  { id: '10', name: 'Emilia' },
];

// Helper function to generate random secret friend assignments
function generateRandomAssignments() {
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

// Initialize assignments on server startup
async function initializeAssignments() {
  try {
    // Always generate new assignments on server startup
    const assignments = generateRandomAssignments();
    await kv.set("secret-friend-assignments", assignments);
    console.log("🎄 Generated new secret friend assignments on startup:", assignments);
    
    // Log the assignments in a readable format
    assignments.forEach(({ personId, secretFriendId }) => {
      const person = participants.find(p => p.id === personId)?.name;
      const secretFriend = participants.find(p => p.id === secretFriendId)?.name;
      console.log(`${person} → ${secretFriend}`);
    });
  } catch (error) {
    console.error("❌ Error initializing assignments:", error);
  }
}

// Initialize assignments when server starts
await initializeAssignments();

// Get secret friend assignments (generated on startup)
app.get("/make-server-252a0d41/assignments", async (c) => {
  try {
    const assignments = await kv.get("secret-friend-assignments");
    
    if (!assignments) {
      return c.json({ error: "Assignments not found. Server may be starting up." }, 404);
    }
    
    return c.json({ assignments });
  } catch (error) {
    console.error("Error getting assignments:", error);
    return c.json({ error: "Failed to get assignments" }, 500);
  }
});

// Force regenerate assignments (admin endpoint)
app.post("/make-server-252a0d41/assignments/regenerate", async (c) => {
  try {
    const newAssignments = generateRandomAssignments();
    await kv.set("secret-friend-assignments", newAssignments);
    
    console.log("🔄 Force regenerated secret friend assignments:", newAssignments);
    
    // Log the new assignments in a readable format
    newAssignments.forEach(({ personId, secretFriendId }) => {
      const person = participants.find(p => p.id === personId)?.name;
      const secretFriend = participants.find(p => p.id === secretFriendId)?.name;
      console.log(`${person} → ${secretFriend}`);
    });
    
    return c.json({ 
      success: true, 
      message: "New assignments generated successfully",
      assignments: newAssignments 
    });
  } catch (error) {
    console.error("❌ Error regenerating assignments:", error);
    return c.json({ error: "Failed to regenerate assignments" }, 500);
  }
});

// Get wishlist for a person
app.get("/make-server-252a0d41/wishlist/:personId", async (c) => {
  try {
    const personId = c.req.param("personId");
    const wishlist = await kv.get(`wishlist-${personId}`);
    
    return c.json({ gifts: wishlist || [] });
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
    
    await kv.set(`wishlist-${personId}`, gifts);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error saving wishlist:", error);
    return c.json({ error: "Failed to save wishlist" }, 500);
  }
});

// Health check endpoint
app.get("/make-server-252a0d41/health", (c) => {
  return c.json({ status: "ok" });
});

Deno.serve(app.fetch);