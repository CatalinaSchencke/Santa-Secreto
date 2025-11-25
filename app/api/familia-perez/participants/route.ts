import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface Participant {
  id: string;
  name: string;
}

export async function GET() {
  try {
    const participantsPath = path.join(process.cwd(), 'data', 'participants.json');
    
    if (!fs.existsSync(participantsPath)) {
      return NextResponse.json({ error: 'Participants file not found' }, { status: 404 });
    }
    
    const fileContent = fs.readFileSync(participantsPath, 'utf-8');
    const participants: Participant[] = JSON.parse(fileContent);
    
    return NextResponse.json(participants);
  } catch (error) {
    console.error('Error reading participants:', error);
    return NextResponse.json({ error: 'Failed to load participants' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    const participantsPath = path.join(process.cwd(), 'data', 'participants.json');
    
    let participants: Participant[] = [];
    if (fs.existsSync(participantsPath)) {
      const fileContent = fs.readFileSync(participantsPath, 'utf-8');
      participants = JSON.parse(fileContent);
    }
    
    // Find next available ID
    const maxId = participants.length > 0 ? Math.max(...participants.map(p => parseInt(p.id))) : 0;
    const newId = (maxId + 1).toString();
    
    // Check if name already exists
    if (participants.some(p => p.name.toLowerCase() === name.trim().toLowerCase())) {
      return NextResponse.json({ error: 'Participant already exists' }, { status: 409 });
    }
    
    const newParticipant: Participant = {
      id: newId,
      name: name.trim()
    };
    
    participants.push(newParticipant);
    
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(participantsPath, JSON.stringify(participants, null, 2));
    
    return NextResponse.json(newParticipant, { status: 201 });
  } catch (error) {
    console.error('Error adding participant:', error);
    return NextResponse.json({ error: 'Failed to add participant' }, { status: 500 });
  }
}