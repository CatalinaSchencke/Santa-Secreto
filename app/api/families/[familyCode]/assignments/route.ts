import { NextRequest, NextResponse } from 'next/server';
import { getFamily, updateFamily } from '@/lib/supabaseStorage';

// Función para generar asignaciones aleatorias
function generateAssignments(participants: string[]): Array<{giver: string, receiver: string, assignedAt: string}> {
  if (participants.length < 2) {
    throw new Error('Se necesitan al menos 2 participantes');
  }

  const shuffled = [...participants];
  
  // Algoritmo Fisher-Yates para mezclar
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Crear asignaciones en círculo
  const assignments = [];
  const assignedAt = new Date().toISOString();
  
  for (let i = 0; i < shuffled.length; i++) {
    const nextIndex = (i + 1) % shuffled.length;
    assignments.push({
      giver: shuffled[i],
      receiver: shuffled[nextIndex],
      assignedAt
    });
  }

  return assignments;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ familyCode: string }> }
) {
  try {
    const { familyCode } = await params;
    const url = new URL(request.url);
    const personName = url.searchParams.get('person');
    
    if (!personName) {
      return NextResponse.json(
        { message: 'Nombre de persona requerido' }, 
        { status: 400 }
      );
    }

    const family = await getFamily(familyCode);
    
    if (!family) {
      return NextResponse.json(
        { message: 'Familia no encontrada' }, 
        { status: 404 }
      );
    }

    // Buscar asignación para esta persona
    const assignment = family.assignments.find(a => a.giver === personName);
    
    if (!assignment) {
      return NextResponse.json(
        { assignment: null, message: 'Asignación no encontrada' }, 
        { status: 200 }
      );
    }

    return NextResponse.json({ assignment });
  } catch (error) {
    console.error('Error getting assignment:', error);
    return NextResponse.json(
      { assignment: null, message: 'Error al obtener asignación' }, 
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
    const { regenerate } = await request.json();

    const family = await getFamily(familyCode);
    
    if (!family) {
      return NextResponse.json(
        { message: 'Familia no encontrada' }, 
        { status: 404 }
      );
    }

    if (family.participants.length < 2) {
      return NextResponse.json(
        { message: 'Se necesitan al menos 2 participantes para generar asignaciones' }, 
        { status: 400 }
      );
    }

    // Si ya hay asignaciones y no se solicita regenerar, devolver las existentes
    if (family.assignments.length > 0 && !regenerate) {
      return NextResponse.json({ 
        assignments: family.assignments,
        message: 'Asignaciones ya generadas'
      });
    }

    // Generar nuevas asignaciones
    const participantNames = family.participants.map(p => p.name);
    const assignments = generateAssignments(participantNames);

    const success = await updateFamily(familyCode, { assignments });
    
    if (!success) {
      return NextResponse.json(
        { message: 'Error al guardar asignaciones' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      assignments,
      message: 'Asignaciones generadas exitosamente' 
    });
  } catch (error) {
    console.error('Error generating assignments:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}