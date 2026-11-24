import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';
import { generateAssignments, validateParticipants } from '../lib/familia-perez-draw.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env.local'), quiet: true });
dotenv.config({ path: path.join(root, '.env'), quiet: true });

const TABLE_NAME = 'kv_store_252a0d41';
const PARTICIPANTS_KEY = 'familia-perez:participants';
const ASSIGNMENTS_KEY = 'familia-perez:assignments';
const WISHLIST_KEY = 'familia-perez:wishlist';
const SPREADSHEET_ID = '1iWiJ8kFPjeGV7h825iFzx2K-sWebLyLm5kQJjlntf9E';
const FIRST_ROW = 4;

const normalizeName = name => String(name ?? '').normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');
const samePeople = (a, b) =>
  Array.isArray(a) && Array.isArray(b) && a.length === b.length &&
  a.every((p, i) => p?.id === b[i]?.id && p?.name === b[i]?.name);

async function main() {
  // Solo en deploy (cada commit), o manualmente con --force
  if (!process.env.VERCEL && !process.env.CI && !process.argv.includes('--force')) {
    console.log('ℹ️ Verificación de Familia Pérez omitida (no es un deploy). Usa --force para ejecutarla.');
    return;
  }

  const participants = JSON.parse(fs.readFileSync(path.join(root, 'data', 'participants.json'), 'utf8'));
  validateParticipants(participants);

  const missing = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'GOOGLE_SHEETS_API_KEY']
    .filter(name => !process.env[name]);
  if (missing.length) throw new Error(`Faltan variables de entorno: ${missing.join(', ')}`);

  // 1. Google Sheets debe tener los mismos nombres, en el mismo orden, que el local
  const sheets = google.sheets({ version: 'v4', auth: process.env.GOOGLE_SHEETS_API_KEY });
  const { data: sheet } = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `B${FIRST_ROW}:B${FIRST_ROW + participants.length - 1}`
  });
  const sheetNames = (sheet.values || []).map(row => row[0]);
  const sheetMismatch = participants.filter((p, i) => normalizeName(sheetNames[i]) !== normalizeName(p.name));
  if (sheetMismatch.length || sheetNames.length !== participants.length) {
    throw new Error(
      'Google Sheets no coincide con data/participants.json. Actualiza las filas ' +
      `${FIRST_ROW}-${FIRST_ROW + participants.length - 1} (columna B). Esperado: ` +
      participants.map(p => p.name).join(', ') + '. Encontrado: ' + sheetNames.join(', ')
    );
  }
  console.log('✅ Google Sheets coincide con participants.json');

  // 2. Base de datos vs local
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data: rows, error } = await supabase
    .from(TABLE_NAME)
    .select('key, value')
    .in('key', [PARTICIPANTS_KEY, ASSIGNMENTS_KEY]);
  if (error) throw error;
  const stored = Object.fromEntries(rows.map(r => [r.key, r.value]));

  const ids = new Set(participants.map(p => p.id));
  const assignmentsValid =
    Array.isArray(stored[ASSIGNMENTS_KEY]) &&
    stored[ASSIGNMENTS_KEY].length === participants.length &&
    stored[ASSIGNMENTS_KEY].every(a => ids.has(a.personId) && ids.has(a.secretFriendId) && a.personId !== a.secretFriendId);

  if (samePeople(stored[PARTICIPANTS_KEY], participants) && assignmentsValid) {
    console.log('✅ Base de datos coincide con participants.json. Se conserva el sorteo existente.');
    return;
  }

  // 3. Lista cambió: nuevo sorteo y regalos limpios (los regalos eran de la lista anterior)
  console.log('🎲 La lista cambió o no hay sorteo: generando nuevo sorteo...');
  const { error: writeError } = await supabase.from(TABLE_NAME).upsert([
    { key: PARTICIPANTS_KEY, value: participants },
    { key: ASSIGNMENTS_KEY, value: generateAssignments(participants) },
    { key: WISHLIST_KEY, value: {} }
  ]);
  if (writeError) throw writeError;
  console.log(`✅ Sorteo guardado para ${participants.length} participantes. Local, base de datos y Google Sheets coinciden.`);
}

main().catch(error => {
  console.error('❌ Verificación de Familia Pérez fallida:', error.message);
  process.exit(1);
});
