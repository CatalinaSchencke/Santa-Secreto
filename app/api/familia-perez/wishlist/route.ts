import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const person = searchParams.get('person');
    
    if (!person) {
      return NextResponse.json({ error: 'Person parameter is required' }, { status: 400 });
    }

    // Obtener wishlist desde Supabase
    const { data, error } = await supabaseAdmin
      .from('kv_store_252a0d41')
      .select('value')
      .eq('key', 'familia-perez:wishlist')
      .single();

    if (error) {
      console.error('Error fetching wishlist:', error);
      return NextResponse.json({ gifts: [] });
    }

    const wishlist = data?.value || {};
    const personGifts = wishlist[person] || [];

    return NextResponse.json({ gifts: personGifts });
  } catch (error) {
    console.error('Error getting wishlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { person, gifts } = body;

    if (!person || !gifts) {
      return NextResponse.json({ error: 'Person and gifts are required' }, { status: 400 });
    }

    // Obtener wishlist actual
    const { data: existingData, error: fetchError } = await supabaseAdmin
      .from('kv_store_252a0d41')
      .select('value')
      .eq('key', 'familia-perez:wishlist')
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching existing wishlist:', fetchError);
      return NextResponse.json({ error: 'Error fetching wishlist' }, { status: 500 });
    }

    const currentWishlist = existingData?.value || {};
    
    // Actualizar wishlist para esta persona
    const updatedWishlist = {
      ...currentWishlist,
      [person]: gifts
    };

    // Guardar en Supabase
    const { error: saveError } = await supabaseAdmin
      .from('kv_store_252a0d41')
      .upsert({
        key: 'familia-perez:wishlist',
        value: updatedWishlist
      });

    if (saveError) {
      console.error('Error saving wishlist:', saveError);
      return NextResponse.json({ error: 'Error saving wishlist' }, { status: 500 });
    }

    return NextResponse.json({ success: true, gifts });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}