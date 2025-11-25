import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

interface Participant {
  id: string;
  name: string;
}

const TABLE_NAME = 'kv_store_252a0d41';
const PARTICIPANTS_KEY = 'familia-perez:participants';

// Default participants for Familia Perez
const DEFAULT_PARTICIPANTS: Participant[] = [
  { id: "1", name: "Paula" },
  { id: "2", name: "Catalina" },
  { id: "3", name: "Brandon" },
  { id: "4", name: "Pilar" },
  { id: "5", name: "Rodolfo" },
  { id: "6", name: "Marcelo" },
  { id: "7", name: "Tatiana" },
  { id: "8", name: "Alfredo" },
  { id: "9", name: "Felipe" },
  { id: "10", name: "Tata" },
  { id: "11", name: "Tita" },
  { id: "12", name: "Daniela" },
  { id: "13", name: "Tito Hector" },
  { id: "14", name: "Rafa" },
  { id: "15", name: "Victoria" }
];

export async function GET() {
  try {
    // Get participants from Supabase
    const { data: participantsData } = await supabaseAdmin
      .from(TABLE_NAME)
      .select('value')
      .eq('key', PARTICIPANTS_KEY)
      .maybeSingle();
    
    if (!participantsData?.value) {
      // If no participants found, initialize with default participants
      const { error } = await supabaseAdmin
        .from(TABLE_NAME)
        .upsert({
          key: PARTICIPANTS_KEY,
          value: DEFAULT_PARTICIPANTS
        });
      
      if (error) {
        console.error('Error saving default participants:', error);
        return NextResponse.json({ error: 'Failed to initialize participants' }, { status: 500 });
      }
      
      console.log('✅ Initialized Familia Perez with default participants');
      return NextResponse.json(DEFAULT_PARTICIPANTS);
    }
    
    return NextResponse.json(participantsData.value);
  } catch (error) {
    console.error('Error loading participants:', error);
    return NextResponse.json({ error: 'Failed to load participants' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    // Get current participants
    const { data: participantsData } = await supabaseAdmin
      .from(TABLE_NAME)
      .select('value')
      .eq('key', PARTICIPANTS_KEY)
      .maybeSingle();
    
    const currentParticipants: Participant[] = participantsData?.value || DEFAULT_PARTICIPANTS;
    
    // Check if participant already exists
    const existingParticipant = currentParticipants.find(
      p => p.name.toLowerCase() === name.trim().toLowerCase()
    );
    
    if (existingParticipant) {
      return NextResponse.json({ error: 'Participant already exists' }, { status: 409 });
    }
    
    // Add new participant
    const maxId = currentParticipants.length > 0 ? Math.max(...currentParticipants.map(p => parseInt(p.id))) : 0;
    const newId = (maxId + 1).toString();
    
    const newParticipant: Participant = {
      id: newId,
      name: name.trim()
    };
    
    const updatedParticipants = [...currentParticipants, newParticipant];
    
    // Save to Supabase
    const { error } = await supabaseAdmin
      .from(TABLE_NAME)
      .upsert({
        key: PARTICIPANTS_KEY,
        value: updatedParticipants
      });
    
    if (error) {
      console.error('Error saving participant:', error);
      return NextResponse.json({ error: 'Failed to save participant' }, { status: 500 });
    }
    
    return NextResponse.json(newParticipant, { status: 201 });
  } catch (error) {
    console.error('Error adding participant:', error);
    return NextResponse.json({ error: 'Failed to add participant' }, { status: 500 });
  }
}