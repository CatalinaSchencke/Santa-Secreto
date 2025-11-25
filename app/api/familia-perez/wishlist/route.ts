import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface WishlistItem {
  personId: string;
  gifts: Gift[];
}

interface Gift {
  name: string;
  link: string;
  image: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const person = searchParams.get('person');
    
    if (!person) {
      return NextResponse.json({ error: 'Person parameter is required' }, { status: 400 });
    }
    
    const wishlistPath = path.join(process.cwd(), 'data', 'wishlist.json');
    
    if (!fs.existsSync(wishlistPath)) {
      return NextResponse.json({ gifts: [] });
    }
    
    const fileContent = fs.readFileSync(wishlistPath, 'utf-8');
    const wishlists: WishlistItem[] = JSON.parse(fileContent);
    
    const personWishlist = wishlists.find(w => w.personId === person);
    
    return NextResponse.json({ 
      gifts: personWishlist ? personWishlist.gifts : []
    });
  } catch (error) {
    console.error('Error reading wishlist:', error);
    return NextResponse.json({ error: 'Failed to load wishlist' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const person = searchParams.get('person');
    
    if (!person) {
      return NextResponse.json({ error: 'Person parameter is required' }, { status: 400 });
    }
    
    const { gifts } = await request.json();
    
    if (!Array.isArray(gifts)) {
      return NextResponse.json({ error: 'Gifts must be an array' }, { status: 400 });
    }
    
    const wishlistPath = path.join(process.cwd(), 'data', 'wishlist.json');
    let wishlists: WishlistItem[] = [];
    
    if (fs.existsSync(wishlistPath)) {
      const fileContent = fs.readFileSync(wishlistPath, 'utf-8');
      wishlists = JSON.parse(fileContent);
    }
    
    // Remove existing wishlist for this person
    wishlists = wishlists.filter(w => w.personId !== person);
    
    // Add new wishlist
    if (gifts.length > 0) {
      wishlists.push({
        personId: person,
        gifts: gifts.filter((gift: Gift) => gift.name.trim() !== '')
      });
    }
    
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(wishlistPath, JSON.stringify(wishlists, null, 2));
    
    return NextResponse.json({ 
      message: 'Wishlist saved successfully',
      giftsCount: gifts.filter((gift: Gift) => gift.name.trim() !== '').length
    });
  } catch (error) {
    console.error('Error saving wishlist:', error);
    return NextResponse.json({ error: 'Failed to save wishlist' }, { status: 500 });
  }
}