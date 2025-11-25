import { NextRequest, NextResponse } from 'next/server';
import { getFamily, updateFamily } from '@/lib/supabaseStorage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ familyCode: string }> }
) {
  try {
    const { familyCode } = await params;
    
    if (!familyCode) {
      return NextResponse.json(
        { message: 'Código de familia requerido' }, 
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

    return NextResponse.json(family);
  } catch (error) {
    console.error('Error getting family:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ familyCode: string }> }
) {
  try {
    const { familyCode } = await params;
    const updatedData = await request.json();
    
    const success = await updateFamily(familyCode, updatedData);
    
    if (!success) {
      return NextResponse.json(
        { message: 'Familia no encontrada o error al actualizar' }, 
        { status: 404 }
      );
    }

    const updatedFamily = await getFamily(familyCode);
    return NextResponse.json(updatedFamily);
  } catch (error) {
    console.error('Error updating family:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}