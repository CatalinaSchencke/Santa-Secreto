import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';
import { google } from 'googleapis';
import participants from '../../../../data/participants.json';

const TABLE_NAME = 'kv_store_252a0d41';
const SPREADSHEET_ID = '1iWiJ8kFPjeGV7h825iFzx2K-sWebLyLm5kQJjlntf9E';
const FIRST_ROW = 4;
const RANGE = `B${FIRST_ROW}:K${FIRST_ROW + participants.length - 1}`;

const normalizeName = (name: string) => name.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');

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

    const { data: storedParticipants, error: participantsError } = await supabaseAdmin
      .from(TABLE_NAME)
      .select('value')
      .eq('key', 'familia-perez:participants')
      .maybeSingle();

    if (participantsError) throw participantsError;
    const saved = storedParticipants?.value;
    if (
      !Array.isArray(saved) ||
      saved.length !== participants.length ||
      participants.some((participant, index) =>
        saved[index]?.id !== participant.id || saved[index]?.name !== participant.name
      )
    ) {
      return NextResponse.json(
        { error: 'Los participantes publicados no coinciden con el sorteo guardado. No se sincronizaron los regalos.' },
        { status: 409 }
      );
    }

    for (let index = 0; index < participants.length; index++) {
      const sheetName = String(sheetData[index]?.[0] ?? '');
      if (normalizeName(sheetName) !== normalizeName(participants[index].name)) {
        return NextResponse.json(
          { error: `El nombre de la fila ${FIRST_ROW + index} de Google Sheets no coincide con ${participants[index].name}. No se sincronizaron los regalos.` },
          { status: 400 }
        );
      }
    }

    // 🔄 STEP 1: Obtener wishlist actual de Supabase
    const { data: currentWishlistData, error: wishlistError } = await supabaseAdmin
      .from(TABLE_NAME)
      .select('value')
      .eq('key', 'familia-perez:wishlist')
      .maybeSingle();

    if (wishlistError) throw wishlistError;

    const currentWishlist = currentWishlistData?.value || {};
    console.log('📋 Wishlist actual cargado');

    // 🔄 STEP 2: Procesar datos del Google Sheets
    const sheetsGifts: { [key: string]: Array<{ id: string; name: string; link?: string; image?: string }> } = {};

    sheetData.forEach((row: (string | number)[], index: number) => {
      const userId = participants[index]?.id;
      
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
      
      // Agregar regalo 1 si existe (ID con prefijo 'gs' para Google Sheets)
      if (gift1 && String(gift1).trim()) {
        gifts.push({
          id: `gs-${userId}-1`,
          name: String(gift1).trim(),
          link: link1 && String(link1).trim() ? String(link1).trim() : undefined,
          image: undefined
        });
      }
      
      // Agregar regalo 2 si existe
      if (gift2 && String(gift2).trim()) {
        gifts.push({
          id: `gs-${userId}-2`, 
          name: String(gift2).trim(),
          link: link2 && String(link2).trim() ? String(link2).trim() : undefined,
          image: undefined
        });
      }
      
      // Agregar regalo 3 si existe
      if (gift3 && String(gift3).trim()) {
        gifts.push({
          id: `gs-${userId}-3`,
          name: String(gift3).trim(), 
          link: link3 && String(link3).trim() ? String(link3).trim() : undefined,
          image: undefined
        });
      }
      
      if (gifts.length > 0) {
        sheetsGifts[userId] = gifts;
      }
    });

    // 🔄 STEP 3: Combinar datos (Google Sheets + App)
    const combinedWishlist: { [key: string]: Array<{ id: string; name: string; link?: string; image?: string }> } = {};

    // Obtener todos los userIds únicos
    const allUserIds = new Set([...Object.keys(currentWishlist), ...Object.keys(sheetsGifts)]);

    allUserIds.forEach(userId => {
      const currentGifts = currentWishlist[userId] || [];
      const sheetsUserGifts = sheetsGifts[userId] || [];

      // Separar regalos de la app (sin prefijo 'gs-') de los del Google Sheets
      const appGifts = currentGifts.filter((gift: { id: string; name: string; link?: string; image?: string }) => !gift.id.startsWith('gs-'));
      
      console.log(`👤 Usuario ${userId}: ${currentGifts.length} regalos actuales, ${sheetsUserGifts.length} del sheets, ${appGifts.length} de la app`);
      
      // Combinar: primero Google Sheets, luego los de la app
      const combinedGifts = [...sheetsUserGifts, ...appGifts];

      if (combinedGifts.length > 0) {
        combinedWishlist[userId] = combinedGifts;
      }
    });

    console.log(`🔄 Combinación completada: ${Object.keys(combinedWishlist).length} usuarios`);

    // 🔄 STEP 4: Actualizar wishlist combinado en Supabase
    const { error } = await supabaseAdmin
      .from(TABLE_NAME)
      .upsert({
        key: 'familia-perez:wishlist',
        value: combinedWishlist
      });

    if (error) {
      console.error('❌ Error updating combined wishlist:', error);
      return NextResponse.json(
        { error: 'Failed to update wishlist' }, 
        { status: 500 }
      );
    }

    // Calcular estadísticas detalladas
    const sheetsGiftsCount = Object.values(sheetsGifts).reduce((sum, gifts) => sum + gifts.length, 0);
    const appGiftsCount = Object.values(combinedWishlist).reduce((sum, gifts) => {
      return sum + gifts.filter(gift => !gift.id.startsWith('gs-')).length;
    }, 0);

    const stats = {
      totalUsers: Object.keys(combinedWishlist).length,
      totalGifts: Object.values(combinedWishlist).reduce((sum, gifts) => sum + gifts.length, 0),
      sheetsGifts: sheetsGiftsCount,
      appGifts: appGiftsCount,
      userStats: Object.entries(combinedWishlist).map(([userId, gifts]) => ({
        userId,
        totalGifts: gifts.length,
        sheetsGifts: gifts.filter(gift => gift.id.startsWith('gs-')).length,
        appGifts: gifts.filter(gift => !gift.id.startsWith('gs-')).length
      }))
    };

    console.log(`✅ Sincronización híbrida completada:`);
    console.log(`📊 Google Sheets: ${sheetsGiftsCount} regalos`);
    console.log(`📱 App: ${appGiftsCount} regalos`);
    console.log(`🎯 Total: ${stats.totalGifts} regalos`);

    return NextResponse.json({ 
      message: 'Sincronización híbrida completada exitosamente',
      description: 'Se combinaron datos del Google Sheets con regalos existentes de la app',
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