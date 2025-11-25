import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

interface WishlistItem {
  personId: string;
  gifts: Gift[];
}

interface Gift {
  id: string;
  name: string;
  link?: string;
  image?: string;
}

const TABLE_NAME = 'kv_store_252a0d41';
const WISHLIST_KEY = 'familia-perez:wishlist';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const person = searchParams.get('person');
    
    if (!person) {
      return NextResponse.json({ error: 'Person parameter is required' }, { status: 400 });
    }
    
    // Get wishlist from Supabase
    const { data: wishlistData } = await supabaseAdmin
      .from(TABLE_NAME)
      .select('value')
      .eq('key', WISHLIST_KEY)
      .maybeSingle();
    
    if (!wishlistData?.value) {
      return NextResponse.json([]);
    }
    
    const wishlists: WishlistItem[] = wishlistData.value;
    const personWishlist = wishlists.find(w => w.personId === person);
    
    return NextResponse.json(personWishlist ? personWishlist.gifts : []);
  } catch (error) {
    console.error('Error reading wishlist:', error);
    return NextResponse.json({ error: 'Failed to load wishlist' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { person, gifts } = await request.json();
    
    if (!person) {
      return NextResponse.json({ error: 'Person parameter is required' }, { status: 400 });
    }
    
    if (!Array.isArray(gifts)) {
      return NextResponse.json({ error: 'Gifts must be an array' }, { status: 400 });
    }
    
    // Get current wishlist from Supabase
    const { data: wishlistData } = await supabaseAdmin
      .from(TABLE_NAME)
      .select('value')
      .eq('key', WISHLIST_KEY)
      .maybeSingle();
    
    let wishlists: WishlistItem[] = wishlistData?.value || [];
    
    // Remove existing wishlist for this person
    wishlists = wishlists.filter(w => w.personId !== person);
    
    // Add new wishlist
    const validGifts = gifts.filter((gift: Gift) => gift.name && gift.name.trim() !== '');
    
    if (validGifts.length > 0) {
      wishlists.push({
        personId: person,
        gifts: validGifts
      });
    }
    
    // Save to Supabase
    const { error } = await supabaseAdmin
      .from(TABLE_NAME)
      .upsert({
        key: WISHLIST_KEY,
        value: wishlists
      });
    
    if (error) {
      console.error('Error saving wishlist to Supabase:', error);
      return NextResponse.json({ error: 'Failed to save wishlist' }, { status: 500 });
    }
    
    console.log(`✅ Saved wishlist for ${person} with ${validGifts.length} gifts`);
    
    return NextResponse.json({ 
      message: 'Wishlist saved successfully',
      giftsCount: validGifts.length
    });
  } catch (error) {
    console.error('Error saving wishlist:', error);
    return NextResponse.json({ error: 'Failed to save wishlist' }, { status: 500 });
  }
}