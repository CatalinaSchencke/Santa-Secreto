import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { supabaseAdmin } from './supabase';
import participants from '../data/participants.json';

const TABLE_NAME = 'kv_store_252a0d41';
const SPREADSHEET_ID = '1iWiJ8kFPjeGV7h825iFzx2K-sWebLyLm5kQJjlntf9E';
const FIRST_ROW = 4;
const SHEETS_CACHE_MS = 30_000;

const normalizeName = (name: unknown) =>
  String(name ?? '').normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');

let sheetsCheck: { at: number; error: string | null } | null = null;

async function checkSheets(): Promise<string | null> {
  if (sheetsCheck && Date.now() - sheetsCheck.at < SHEETS_CACHE_MS) return sheetsCheck.error;

  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  if (!apiKey || apiKey === 'tu_api_key_aqui') return 'Google Sheets API Key no configurada';

  const sheets = google.sheets({ version: 'v4', auth: apiKey });
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `B${FIRST_ROW}:B${FIRST_ROW + participants.length - 1}`,
  });
  const names = (data.values || []).map(row => row[0]);
  const ok =
    names.length === participants.length &&
    participants.every((p, i) => normalizeName(names[i]) === normalizeName(p.name));

  const error = ok ? null : 'Google Sheets no coincide con la lista local de participantes';
  sheetsCheck = { at: Date.now(), error };
  return error;
}

// Verifica que participants.json, la base de datos y Google Sheets coincidan.
// Devuelve una respuesta de error si no, o null si todo está consistente.
export async function verifyFamiliaPerezConsistency(): Promise<NextResponse | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLE_NAME)
      .select('key, value')
      .in('key', ['familia-perez:participants', 'familia-perez:assignments']);
    if (error) throw error;

    const stored = Object.fromEntries((data || []).map(r => [r.key, r.value]));
    const dbParticipants = stored['familia-perez:participants'];
    const assignments = stored['familia-perez:assignments'];
    const ids = new Set(participants.map(p => p.id));

    const dbMatches =
      Array.isArray(dbParticipants) &&
      dbParticipants.length === participants.length &&
      participants.every((p, i) => dbParticipants[i]?.id === p.id && dbParticipants[i]?.name === p.name);
    const assignmentsMatch =
      Array.isArray(assignments) &&
      assignments.length === participants.length &&
      assignments.every(
        (a: { personId: string; secretFriendId: string }) =>
          ids.has(a.personId) && ids.has(a.secretFriendId) && a.personId !== a.secretFriendId
      );

    if (!dbMatches || !assignmentsMatch) {
      return NextResponse.json(
        { error: 'La base de datos no coincide con la lista local de participantes. Se requiere un nuevo deploy.' },
        { status: 409 }
      );
    }

    const sheetsError = await checkSheets();
    if (sheetsError) return NextResponse.json({ error: sheetsError }, { status: 409 });

    return null;
  } catch (error) {
    console.error('Error verificando consistencia de Familia Pérez:', error);
    return NextResponse.json({ error: 'No se pudo verificar la consistencia de los datos' }, { status: 500 });
  }
}
