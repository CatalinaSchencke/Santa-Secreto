import { NextRequest, NextResponse } from 'next/server';
import { getFamily, updateFamily } from '../../../../../lib/supabaseStorage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ familyCode: string }> }
) {
  try {
    const { familyCode } = await params;
    const { searchParams } = new URL(request.url);
    const person = searchParams.get('person');
    
    if (!person) {
      return NextResponse.json({ error: 'Person parameter is required' }, { status: 400 });
    }

    const family = await getFamily(familyCode);
    
    if (!family) {
      return NextResponse.json({ gifts: [] }, { status: 404 });
    }

    // Find participant by name
    const participant = family.participants.find(p => p.name === person);
    if (!participant) {
      return NextResponse.json({ gifts: [] }, { status: 404 });
    }

    // Get wishlist for this participant and convert to familia-perez format
    const participantWishlist = family.wishlist
      .filter(item => item.participantId === participant.id)
      .map(item => {
        // Parse the item if it's JSON (for new format with link/image)
        let parsedItem;
        try {
          parsedItem = typeof item.item === 'string' ? JSON.parse(item.item) : item.item;
        } catch {
          // Fallback for old format (just text)
          parsedItem = { name: item.item };
        }
        
        return {
          id: item.id.toString(),
          name: parsedItem.name || item.item,
          link: parsedItem.link,
          image: parsedItem.image
        };
      });
    
    return NextResponse.json({ gifts: participantWishlist });
  } catch (error) {
    console.error('Error getting wishlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ familyCode: string }> }
) {
  try {
    const { familyCode } = await params;
    const body = await request.json();
    const { person, gifts } = body;

    if (!person || !gifts) {
      return NextResponse.json({ error: 'Person and gifts are required' }, { status: 400 });
    }

    const family = await getFamily(familyCode);
    
    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    // Find participant by name
    const participant = family.participants.find(p => p.name === person);
    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    // Remove existing wishlist items for this participant
    const filteredWishlist = family.wishlist.filter(item => item.participantId !== participant.id);
    
    // Add new items
    const newWishlistItems = gifts.map((gift: { name: string; link?: string; image?: string }, index: number) => ({
      id: filteredWishlist.length + index + 1,
      participantId: participant.id,
      item: JSON.stringify({
        name: gift.name,
        link: gift.link,
        image: gift.image
      }),
      addedAt: new Date().toISOString(),
    }));

    const updatedWishlist = [...filteredWishlist, ...newWishlistItems];
    
    const success = await updateFamily(familyCode, { wishlist: updatedWishlist });
    
    if (!success) {
      return NextResponse.json({ error: 'Error saving wishlist' }, { status: 500 });
    }

    return NextResponse.json({ success: true, gifts });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}