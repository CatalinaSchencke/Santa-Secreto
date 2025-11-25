import { NextRequest, NextResponse } from 'next/server';
import { getFamily, updateFamily } from '@/lib/supabaseStorage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ familyCode: string; personId: string }> }
) {
  try {
    const { familyCode, personId } = await params;
    
    const family = await getFamily(familyCode);
    
    if (!family) {
      return NextResponse.json(
        { gifts: [], message: 'Familia no encontrada' }, 
        { status: 404 }
      );
    }

    // Filtrar wishlist por participante
    const participantId = parseInt(personId);
    const participantWishlist = family.wishlist.filter(item => item.participantId === participantId);
    
    return NextResponse.json({ gifts: participantWishlist });
  } catch (error) {
    console.error('Error getting wishlist:', error);
    return NextResponse.json(
      { gifts: [], message: 'Error al obtener lista de regalos' }, 
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ familyCode: string; personId: string }> }
) {
  try {
    const { familyCode, personId } = await params;
    const { gift } = await request.json();
    
    if (!gift?.trim()) {
      return NextResponse.json(
        { message: 'Regalo requerido' }, 
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

    const participantId = parseInt(personId);
    
    // Verificar que el participante existe
    const participant = family.participants.find(p => p.id === participantId);
    if (!participant) {
      return NextResponse.json(
        { message: 'Participante no encontrado' }, 
        { status: 404 }
      );
    }

    // Agregar nuevo item a la wishlist
    const newWishlistItem = {
      id: family.wishlist.length + 1,
      participantId,
      item: gift.trim(),
      addedAt: new Date().toISOString(),
    };

    const updatedWishlist = [...family.wishlist, newWishlistItem];
    
    const success = await updateFamily(familyCode, { wishlist: updatedWishlist });
    
    if (!success) {
      return NextResponse.json(
        { message: 'Error al agregar regalo a la lista' }, 
        { status: 500 }
      );
    }

    return NextResponse.json(newWishlistItem);
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ familyCode: string; personId: string }> }
) {
  try {
    const { familyCode, personId } = await params;
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    
    if (!itemId) {
      return NextResponse.json(
        { message: 'ID del regalo requerido' }, 
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

    const participantId = parseInt(personId);
    
    // Filtrar el item específico
    const updatedWishlist = family.wishlist.filter(
      item => !(item.id === parseInt(itemId) && item.participantId === participantId)
    );

    const success = await updateFamily(familyCode, { wishlist: updatedWishlist });
    
    if (!success) {
      return NextResponse.json(
        { message: 'Error al eliminar regalo' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Regalo eliminado de la lista' });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}