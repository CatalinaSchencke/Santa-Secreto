import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Configurar Google Sheets API
// Necesitarás instalar: npm install googleapis
// import { google } from 'googleapis';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const TABLE_NAME = 'kv_store_252a0d41';
const SPREADSHEET_ID = '1iWiJ8kFPjeGV7h825iFzx2K-sWebLyLm5kQJjlntf9E';

// Mapeo de filas del spreadsheet (4-20) con IDs de usuarios (1-17)
const ROW_TO_USER_ID = {
  4: "1",   // Tatiana
  5: "2",   // Alfredo  
  6: "3",   // Vane
  7: "4",   // Pipe
  8: "5",   // Tita
  9: "6",   // Tata Lucho
  10: "7",  // Marcelo
  11: "8",  // Rodolfo
  12: "9",  // Pilar
  13: "10", // Cata
  14: "11", // Brandon
  15: "12", // Paula
  16: "13", // Tía Brenda
  17: "14", // Daniela
  18: "15", // Héctor (Tito)
  19: "16", // Rafa
  20: "17"  // Victoria
};

async function syncFromGoogleSheets() {
  try {
    console.log('🔄 Sincronizando Google Sheets con Supabase...');

    // TODO: Configurar autenticación de Google Sheets API
    // const auth = new google.auth.GoogleAuth({
    //   keyFile: 'path/to/service-account-key.json',
    //   scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    // });
    // const sheets = google.sheets({ version: 'v4', auth });

    // Para ahora, simularemos los datos que vendrían del spreadsheet
    // En la implementación real, esto vendría de la API de Google Sheets

    // Ejemplo de cómo se vería la llamada real:
    // const response = await sheets.spreadsheets.values.get({
    //   spreadsheetId: SPREADSHEET_ID,
    //   range: 'B4:K20', // Columnas B a K, filas 4 a 20
    // });
    // const rows = response.data.values;

    // Simular datos del spreadsheet para testing
    const mockSheetData = [
      ['Tatiana', 'Regalo 1', 'https://link1.com', '', 'Regalo 2', '', 'https://link2.com', 'Regalo 3', '', 'https://link3.com'],
      ['Alfredo', 'Regalo A', '', '', 'Regalo B', '', '', '', '', ''],
      // ... más filas
    ];

    const currentWishlist = await getCurrentWishlist();
    const newWishlist = {};

    // Procesar cada fila del spreadsheet
    mockSheetData.forEach((row, index) => {
      const rowNumber = index + 4; // Las filas empiezan en 4
      const userId = ROW_TO_USER_ID[rowNumber];
      
      if (!userId) return;

      const [name, gift1, link1, , gift2, , link2, gift3, , link3] = row;
      
      const gifts = [];
      
      // Agregar regalo 1 si existe
      if (gift1 && gift1.trim()) {
        gifts.push({
          id: `${userId}-1`,
          name: gift1.trim(),
          link: link1 && link1.trim() ? link1.trim() : undefined,
          image: undefined
        });
      }
      
      // Agregar regalo 2 si existe
      if (gift2 && gift2.trim()) {
        gifts.push({
          id: `${userId}-2`,
          name: gift2.trim(),
          link: link2 && link2.trim() ? link2.trim() : undefined,
          image: undefined
        });
      }
      
      // Agregar regalo 3 si existe
      if (gift3 && gift3.trim()) {
        gifts.push({
          id: `${userId}-3`,
          name: gift3.trim(),
          link: link3 && link3.trim() ? link3.trim() : undefined,
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
      throw error;
    }

    console.log('✅ Wishlist sincronizada exitosamente');
    console.log(`📊 Usuarios con regalos: ${Object.keys(newWishlist).length}`);
    
    Object.entries(newWishlist).forEach(([userId, gifts]) => {
      console.log(`   Usuario ${userId}: ${gifts.length} regalo(s)`);
    });

  } catch (error) {
    console.error('❌ Error sincronizando:', error);
    process.exit(1);
  }
}

async function getCurrentWishlist() {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLE_NAME)
      .select('value')
      .eq('key', 'familia-perez:wishlist')
      .single();

    if (error) {
      console.log('No se encontró wishlist existente, creando nuevo');
      return {};
    }

    return data?.value || {};
  } catch (error) {
    console.log('Error obteniendo wishlist actual, creando nuevo');
    return {};
  }
}

// Ejecutar sincronización
syncFromGoogleSheets();