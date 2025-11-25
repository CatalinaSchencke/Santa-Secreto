import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

export async function GET() {
  try {
    // Obtener participantes desde Supabase
    const { data, error } = await supabaseAdmin
      .from('kv_store_252a0d41')
      .select('value')
      .eq('key', 'familia-perez:participants')
      .single();

    if (error) {
      console.error('Error fetching participants:', error);
      return NextResponse.json({ error: 'Error fetching participants' }, { status: 500 });
    }

    const participants = data?.value || [];
    return NextResponse.json({ participants });
  } catch (error) {
    console.error('Error getting participants:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}