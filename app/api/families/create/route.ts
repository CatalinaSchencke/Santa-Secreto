import { NextRequest, NextResponse } from 'next/server';
import { createFamily, familyExists } from '@/lib/familyFileStorage';

// Generar código de 6 caracteres memorable
function generateCode(familyName: string): string {
  const cleanName = familyName.toUpperCase().replace(/[^A-Z]/g, '');
  const namePrefix = cleanName.substring(0, 3);
  const numbers = Math.floor(Math.random() * 900) + 100; // 100-999
  return (namePrefix + numbers).substring(0, 6);
}

// Verificar si el código ya existe
async function codeExists(code: string): Promise<boolean> {
  return familyExists(code);
}

export async function POST(request: NextRequest) {
  try {
    const { name, eventDate, maxBudget } = await request.json();
    
    if (!name?.trim()) {
      return NextResponse.json(
        { message: 'El nombre de la familia es requerido' }, 
        { status: 400 }
      );
    }

    // Generar código único
    let code = generateCode(name);
    let attempts = 0;
    
    // Intentar hasta 10 veces si el código ya existe
    while (await codeExists(code) && attempts < 10) {
      code = generateCode(name);
      attempts++;
    }
    
    if (attempts >= 10) {
      return NextResponse.json(
        { message: 'No se pudo generar un código único. Intenta con otro nombre.' }, 
        { status: 500 }
      );
    }

    // Crear información de la familia
    const familyInfo = {
      code,
      name: name.trim(),
      eventDate: eventDate || null,
      maxBudget: maxBudget || null,
      createdAt: new Date().toISOString(),
    };

    // Guardar en archivo
    const created = createFamily(familyInfo);
    
    if (!created) {
      return NextResponse.json(
        { message: 'Error al crear el archivo de la familia' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({
      code,
      message: 'Familia creada exitosamente',
      family: familyInfo,
    });

  } catch (error) {
    console.error('Error creating family:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}