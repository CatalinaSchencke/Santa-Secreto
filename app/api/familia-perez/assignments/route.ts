import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

interface Participant {
  id: string;
  name: string;
}

interface Assignment {
  personId: string;
  secretFriendId: string;
}

const TABLE_NAME = 'kv_store_252a0d41';
const ASSIGNMENTS_KEY = 'familia-perez:assignments';
const PARTICIPANTS_KEY = 'familia-perez:participants';

function generateAssignments(participants: Participant[]): Assignment[] {
  if (participants.length < 2) {
    throw new Error('At least 2 participants required');
  }
  
  const shuffled = [...participants].sort(() => Math.random() - 0.5);
  const assignments: Assignment[] = [];
  
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const person = searchParams.get('person');
    
    // Get assignments from Supabase
    const { data: assignmentsData } = await supabaseAdmin
      .from(TABLE_NAME)
      .select('value')
      .eq('key', ASSIGNMENTS_KEY)
      .maybeSingle();
    
    if (!assignmentsData?.value) {
      return NextResponse.json({ error: 'No assignments found. Generate assignments first.' }, { status: 404 });
    }
    
    const assignments: Assignment[] = assignmentsData.value;
    
    if (person) {
      const personAssignment = assignments.find(a => a.personId === person);
      if (!personAssignment) {
        return NextResponse.json({ error: 'Assignment not found for this person' }, { status: 404 });
      }
      
      // Get participants from Supabase
      const { data: participantsData } = await supabaseAdmin
        .from(TABLE_NAME)
        .select('value')
        .eq('key', PARTICIPANTS_KEY)
        .maybeSingle();
      
      if (!participantsData?.value) {
        return NextResponse.json({ error: 'Participants not found' }, { status: 404 });
      }
      
      const participants: Participant[] = participantsData.value;
      const secretFriend = participants.find(p => p.id === personAssignment.secretFriendId);
      
      if (!secretFriend) {
        return NextResponse.json({ error: 'Secret friend not found' }, { status: 404 });
      }
      
      return NextResponse.json({ 
        secretFriend: secretFriend.name,
        secretFriendId: secretFriend.id
      });
    }
    
    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Error reading assignments:', error);
    return NextResponse.json({ error: 'Failed to load assignments' }, { status: 500 });
  }
}

export async function POST() {
  try {
    // Get participants from Supabase
    const { data: participantsData } = await supabaseAdmin
      .from(TABLE_NAME)
      .select('value')
      .eq('key', PARTICIPANTS_KEY)
      .maybeSingle();
    
    if (!participantsData?.value) {
      return NextResponse.json({ error: 'No participants found' }, { status: 404 });
    }
    
    const participants: Participant[] = participantsData.value;
    
    if (participants.length < 2) {
      return NextResponse.json({ error: 'At least 2 participants required' }, { status: 400 });
    }
    
    // Generate new assignments
    const assignments = generateAssignments(participants);
    
    // Save assignments to Supabase
    const { error } = await supabaseAdmin
      .from(TABLE_NAME)
      .upsert({
        key: ASSIGNMENTS_KEY,
        value: assignments
      });
    
    if (error) {
      console.error('Error saving assignments to Supabase:', error);
      return NextResponse.json({ error: 'Failed to save assignments' }, { status: 500 });
    }
    
    console.log(`✅ Generated and saved ${assignments.length} assignments for Familia Perez`);
    
    return NextResponse.json({ 
      message: 'Assignments generated successfully',
      totalAssignments: assignments.length,
      assignments
    });
  } catch (error) {
    console.error('Error generating assignments:', error);
    return NextResponse.json({ error: 'Failed to generate assignments' }, { status: 500 });
  }
}