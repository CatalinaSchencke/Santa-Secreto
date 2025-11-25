import { NextRequest, NextResponse } from 'next/server';
import { getFamily, updateFamily } from '@/lib/familyFileStorage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ familyCode: string }> }
) {
  try {
    const { familyCode } = await params;
    const family = getFamily(familyCode);
    
    if (!family) {
      return NextResponse.json(
        { message: 'Familia no encontrada' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(family.participants);
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ familyCode: string }> }
) {
  try {
    const { familyCode } = await params;
    const { name } = await request.json();
    
    if (!name?.trim()) {
      return NextResponse.json(
        { message: 'El nombre del participante es requerido' }, 
        { status: 400 }
      );
    }

    const family = getFamily(familyCode);
    
    if (!family) {
      return NextResponse.json(
        { message: 'Familia no encontrada' }, 
        { status: 404 }
      );
    }

    // Verificar si el participante ya existe
    const existingParticipant = family.participants.find(
      p => p.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (existingParticipant) {
      return NextResponse.json(
        { message: 'El participante ya existe' }, 
        { status: 400 }
      );
    }

    // Agregar nuevo participante
    const newParticipant = {
      id: family.participants.length + 1,
      name: name.trim(),
      addedAt: new Date().toISOString(),
    };

    const updatedParticipants = [...family.participants, newParticipant];
    
    const success = updateFamily(familyCode, { participants: updatedParticipants });
    
    if (!success) {
      return NextResponse.json(
        { message: 'Error al agregar participante' }, 
        { status: 500 }
      );
    }

    return NextResponse.json(newParticipant);
  } catch (error) {
    console.error('Error adding participant:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ familyCode: string }> }
) {
  try {
    const { familyCode } = await params;
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('id');
    
    if (!participantId) {
      return NextResponse.json(
        { message: 'ID del participante requerido' }, 
        { status: 400 }
      );
    }

    const family = getFamily(familyCode);
    
    if (!family) {
      return NextResponse.json(
        { message: 'Familia no encontrada' }, 
        { status: 404 }
      );
    }

    const updatedParticipants = family.participants.filter(
      p => p.id !== parseInt(participantId)
    );

    const success = updateFamily(familyCode, { participants: updatedParticipants });
    
    if (!success) {
      return NextResponse.json(
        { message: 'Error al eliminar participante' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Participante eliminado' });
  } catch (error) {
    console.error('Error removing participant:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}