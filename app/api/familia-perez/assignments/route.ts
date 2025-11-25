import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const person = searchParams.get('person');
    
    if (!person) {
      return NextResponse.json({ error: 'Person parameter is required' }, { status: 400 });
    }

    // Obtener asignaciones desde Supabase
    const { data, error } = await supabaseAdmin
      .from('kv_store_252a0d41')
      .select('value')
      .eq('key', 'familia-perez:assignments')
      .single();

    if (error) {
      console.error('Error fetching assignments:', error);
      return NextResponse.json({ error: 'Error fetching assignments' }, { status: 500 });
    }

    const assignments = data?.value || {};
    const assignment = assignments[person];

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    return NextResponse.json({ assignment });
  } catch (error) {
    console.error('Error getting assignments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}