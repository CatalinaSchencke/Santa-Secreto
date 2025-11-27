import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';
import { google } from 'googleapis';

const TABLE_NAME = 'kv_store_252a0d41';
const SPREADSHEET_ID = '1iWiJ8kFPjeGV7h825iFzx2K-sWebLyLm5kQJjlntf9E';
const RANGE = 'B4:K20'; // Columnas B a K, filas 4 a 20

// Mapeo de orden en el spreadsheet con user IDs
const SPREADSHEET_ORDER_TO_USER_ID = [
  "1",   // Tatiana (fila 4)
  "2",   // Alfredo (fila 5)  
  "3",   // Vane (fila 6)
  "4",   // Pipe (fila 7)
  "5",   // Tita (fila 8)
  "6",   // Tata Lucho (fila 9)
  "7",   // Marcelo (fila 10)
  "8",   // Rodolfo (fila 11)
  "9",   // Pilar (fila 12)
  "10",  // Cata (fila 13)
  "11",  // Brandon (fila 14)
  "12",  // Paula (fila 15)
  "13",  // Tía Brenda (fila 16)
  "14",  // Daniela (fila 17)
  "15",  // Héctor (Tito) (fila 18)
  "16",  // Rafa (fila 19)
  "17"   // Victoria (fila 20)
];

export async function POST() {
  try {
    console.log('🔄 Sincronizando con Google Sheets...');

    // Verificar que tengamos la API Key
    if (!process.env.GOOGLE_SHEETS_API_KEY || process.env.GOOGLE_SHEETS_API_KEY === 'tu_api_key_aqui') {
      return NextResponse.json(
        { 
          error: 'Google Sheets API Key no configurada',
          instructions: 'Configura GOOGLE_SHEETS_API_KEY en el archivo .env.local'
        }, 
        { status: 500 }
      );
    }

    // Configurar autenticación con API Key
    const sheets = google.sheets({ 
      version: 'v4', 
      auth: process.env.GOOGLE_SHEETS_API_KEY 
    });

    // Obtener datos del spreadsheet
    console.log(`📊 Obteniendo datos del rango ${RANGE}...`);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });

    const sheetData = response.data.values || [];
    console.log(`📋 Obtenidas ${sheetData.length} filas del spreadsheet`);

    if (sheetData.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron datos en el spreadsheet' }, 
        { status: 400 }
      );
    }

    const newWishlist: { [key: string]: Array<{ id: string; name: string; link?: string; image?: string }> } = {};

    // Procesar cada fila del spreadsheet
    sheetData.forEach((row: (string | number)[], index: number) => {
      const userId = SPREADSHEET_ORDER_TO_USER_ID[index];
      
      if (!userId || !row || row.length < 2) return;

      const [
        ,           // Columna B (nombre - no usado aquí)
        gift1,      // Columna C  
        ,           // Columna D (vacía)
        link1,      // Columna E
        gift2,      // Columna F
        ,           // Columna G (vacía) 
        link2,      // Columna H
        gift3,      // Columna I
        ,           // Columna J (vacía)
        link3       // Columna K
      ] = row;
      
      const gifts = [];
      
      // Agregar regalo 1 si existe
      if (gift1 && String(gift1).trim()) {
        gifts.push({
          id: `${userId}-1`,
          name: String(gift1).trim(),
          link: link1 && String(link1).trim() ? String(link1).trim() : undefined,
          image: undefined
        });
      }
      
      // Agregar regalo 2 si existe
      if (gift2 && String(gift2).trim()) {
        gifts.push({
          id: `${userId}-2`, 
          name: String(gift2).trim(),
          link: link2 && String(link2).trim() ? String(link2).trim() : undefined,
          image: undefined
        });
      }
      
      // Agregar regalo 3 si existe
      if (gift3 && String(gift3).trim()) {
        gifts.push({
          id: `${userId}-3`,
          name: String(gift3).trim(), 
          link: link3 && String(link3).trim() ? String(link3).trim() : undefined,
          image: undefined
        });
      }
      
      if (gifts.length > 0) {
        newWishlist[userId] = gifts;
      }
    });

    // Actualizar wishlist en Supabase
    const { error } = await supabaseAdmin
      .from(TABLE_NAME)
      .upsert({
        key: 'familia-perez:wishlist',
        value: newWishlist
      });

    if (error) {
      console.error('Error updating wishlist:', error);
      return NextResponse.json(
        { error: 'Failed to update wishlist' }, 
        { status: 500 }
      );
    }

    const stats = {
      totalUsers: Object.keys(newWishlist).length,
      totalGifts: Object.values(newWishlist).reduce((sum, gifts) => sum + gifts.length, 0),
      userStats: Object.entries(newWishlist).map(([userId, gifts]) => ({
        userId,
        giftCount: gifts.length
      }))
    };

    return NextResponse.json({ 
      message: 'Wishlist updated successfully',
      stats
    });

  } catch (error) {
    console.error('Error syncing Google Sheets:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}