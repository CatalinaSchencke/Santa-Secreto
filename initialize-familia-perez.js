import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const TABLE_NAME = 'kv_store_252a0d41';

// Default participants for Familia Perez
const DEFAULT_PARTICIPANTS = [
  { id: "1", name: "Tatiana" },
  { id: "2", name: "Alfredo" },
  { id: "3", name: "Vane" },
  { id: "4", name: "Pipe" },
  { id: "5", name: "Tita" },
  { id: "6", name: "Tata Lucho" },
  { id: "7", name: "Marcelo" },
  { id: "8", name: "Rodolfo" },
  { id: "9", name: "Cata" },
  { id: "10", name: "Bastian" },
  { id: "11", name: "Paula" },
  { id: "12", name: "Daniela" },
  { id: "13", name: "Héctor (Tito)" },
  { id: "14", name: "Rafa" },
  { id: "15", name: "Victoria" }
];

function generateAssignments(participants) {
  if (participants.length < 2) {
    throw new Error('At least 2 participants required');
  }
  
  const shuffled = [...participants].sort(() => Math.random() - 0.5);
  const assignments = [];
  
  for (let i = 0; i < shuffled.length; i++) {
    const currentPerson = shuffled[i];
    const nextPerson = shuffled[(i + 1) % shuffled.length];
    
    assignments.push({
      personId: currentPerson.id,
      secretFriendId: nextPerson.id
    });
  }
  
  return assignments;
}

async function initializeFamiliaPerez() {
  try {
    console.log('🎄 Initializing Familia Perez data in Supabase...');
    
    // Initialize participants
    const { error: participantsError } = await supabaseAdmin
      .from(TABLE_NAME)
      .upsert({
        key: 'familia-perez:participants',
        value: DEFAULT_PARTICIPANTS
      });
    
    if (participantsError) {
      console.error('❌ Error saving participants:', participantsError);
      throw participantsError;
    }
    
    console.log(`✅ Saved ${DEFAULT_PARTICIPANTS.length} participants`);
    
    // Generate and save assignments
    const assignments = generateAssignments(DEFAULT_PARTICIPANTS);
    
    const { error: assignmentsError } = await supabaseAdmin
      .from(TABLE_NAME)
      .upsert({
        key: 'familia-perez:assignments',
        value: assignments
      });
    
    if (assignmentsError) {
      console.error('❌ Error saving assignments:', assignmentsError);
      throw assignmentsError;
    }
    
    console.log(`✅ Generated and saved ${assignments.length} assignments`);
    
    // // Log assignments for debugging
    // console.log('🎯 Secret Friend Assignments:');
    // assignments.forEach(({ personId, secretFriendId }) => {
    //   const person = DEFAULT_PARTICIPANTS.find(p => p.id === personId)?.name;
    //   const secretFriend = DEFAULT_PARTICIPANTS.find(p => p.id === secretFriendId)?.name;
    //   console.log(`   ${person} → ${secretFriend}`);
    // });
    
    // Initialize empty wishlist
    const { error: wishlistError } = await supabaseAdmin
      .from(TABLE_NAME)
      .upsert({
        key: 'familia-perez:wishlist',
        value: []
      });
    
    if (wishlistError) {
      console.error('❌ Error initializing wishlist:', wishlistError);
      throw wishlistError;
    }
    
    console.log('✅ Initialized empty wishlist');
    console.log('🎉 Familia Perez initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Failed to initialize Familia Perez:', error);
    process.exit(1);
  }
}

// Run initialization
initializeFamiliaPerez();