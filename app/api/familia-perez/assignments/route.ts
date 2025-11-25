import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface Participant {
  id: string;
  name: string;
}

interface Assignment {
  personId: string;
  secretFriendId: string;
}

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
    
    const assignmentsPath = path.join(process.cwd(), 'data', 'assignments.json');
    
    if (!fs.existsSync(assignmentsPath)) {
      return NextResponse.json({ error: 'No assignments found. Generate assignments first.' }, { status: 404 });
    }
    
    const fileContent = fs.readFileSync(assignmentsPath, 'utf-8');
    const assignments: Assignment[] = JSON.parse(fileContent);
    
    if (person) {
      const personAssignment = assignments.find(a => a.personId === person);
      if (!personAssignment) {
        return NextResponse.json({ error: 'Assignment not found for this person' }, { status: 404 });
      }
      
      // Get participant names
      const participantsPath = path.join(process.cwd(), 'data', 'participants.json');
      const participantsContent = fs.readFileSync(participantsPath, 'utf-8');
      const participants: Participant[] = JSON.parse(participantsContent);
      
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
    // Read participants
    const participantsPath = path.join(process.cwd(), 'data', 'participants.json');
    
    if (!fs.existsSync(participantsPath)) {
      return NextResponse.json({ error: 'No participants found' }, { status: 404 });
    }
    
    const participantsContent = fs.readFileSync(participantsPath, 'utf-8');
    const participants: Participant[] = JSON.parse(participantsContent);
    
    if (participants.length < 2) {
      return NextResponse.json({ error: 'At least 2 participants required' }, { status: 400 });
    }
    
    // Generate new assignments
    const assignments = generateAssignments(participants);
    
    // Save assignments
    const assignmentsPath = path.join(process.cwd(), 'data', 'assignments.json');
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(assignmentsPath, JSON.stringify(assignments, null, 2));
    
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