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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const person = searchParams.get('person');
    
    // Get assignments from Supabase
    const { data: assignmentsData, error: assignmentsError } = await supabaseAdmin
      .from(TABLE_NAME)
      .select('value')
      .eq('key', ASSIGNMENTS_KEY)
      .maybeSingle();

    if (assignmentsError) throw assignmentsError;
    
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
      const { data: participantsData, error: participantsError } = await supabaseAdmin
        .from(TABLE_NAME)
        .select('value')
        .eq('key', PARTICIPANTS_KEY)
        .maybeSingle();

      if (participantsError) throw participantsError;
      
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
