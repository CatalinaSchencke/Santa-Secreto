import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { generateAssignments, validateParticipants } from './lib/familia-perez-draw.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.local'), quiet: true });
dotenv.config({ path: path.join(__dirname, '.env'), quiet: true });

const TABLE_NAME = 'kv_store_252a0d41';
const PARTICIPANTS_KEY = 'familia-perez:participants';
const ASSIGNMENTS_KEY = 'familia-perez:assignments';
const WISHLIST_KEY = 'familia-perez:wishlist';

async function initializeFamiliaPerez() {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--reroll') || args.length > 1) {
    throw new Error('Uso: npm run sorteo-familia-perez -- [--reroll]');
  }
  const reroll = args.includes('--reroll');
  const participants = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'participants.json'), 'utf8'));
  validateParticipants(participants);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const keys = [PARTICIPANTS_KEY, ASSIGNMENTS_KEY, WISHLIST_KEY];
  const { data: existing, error: readError } = await supabase
    .from(TABLE_NAME)
    .select('key')
    .in('key', keys);
  if (readError) throw readError;

  if (existing.length > 0 && !reroll) {
    throw new Error('Ya existen datos de Familia Pérez. No se modificaron. Para reemplazar el sorteo y borrar los regalos, usa --reroll.');
  }

  const assignments = generateAssignments(participants);
  const rows = [
    { key: PARTICIPANTS_KEY, value: participants },
    { key: ASSIGNMENTS_KEY, value: assignments },
    { key: WISHLIST_KEY, value: {} }
  ];
  const query = supabase.from(TABLE_NAME);
  const { error: writeError } = reroll ? await query.upsert(rows) : await query.insert(rows);
  if (writeError) throw writeError;

  console.log(`✅ Sorteo guardado para ${participants.length} participantes.`);
  console.log('✅ Lista de regalos inicializada vacía. Sincroniza Google Sheets desde la aplicación.');
}

initializeFamiliaPerez().catch(error => {
  console.error('❌ No se pudo inicializar el sorteo:', error.message);
  process.exitCode = 1;
});
