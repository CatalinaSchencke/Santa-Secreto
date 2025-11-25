import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Esta función se usará como template para crear Edge Functions específicas para cada familia
// Se reemplaza FAMILY_CODE por el código real de la familia
const FAMILY_CODE = "{{FAMILY_CODE}}";
const KV_TABLE = `kv_store_${FAMILY_CODE}`;

interface FamilyData {
  participants?: string[];
  assignments?: Record<string, string>;
  wishlists?: Record<string, any[]>;
  familyInfo?: {
    name: string;
    eventDate?: string;
    maxBudget?: number;
    createdAt: string;
  };
}

// Obtener datos del KV store
async function getKVData(key: string): Promise<any> {
  try {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/${KV_TABLE}?key=eq.${key}`, {
      headers: {
        'apikey': Deno.env.get('SUPABASE_ANON_KEY')!,
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.length > 0 ? data[0].value : null;
    }
    return null;
  } catch (error) {
    console.error('Error getting KV data:', error);
    return null;
  }
}

// Guardar datos en el KV store
async function setKVData(key: string, value: any): Promise<boolean> {
  try {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/${KV_TABLE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': Deno.env.get('SUPABASE_ANON_KEY')!,
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        key,
        value,
        updated_at: new Date().toISOString(),
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error setting KV data:', error);
    return false;
  }
}

// Manejar participantes
async function handleParticipants(request: Request): Promise<Response> {
  if (request.method === 'GET') {
    const participants = await getKVData('participants') || [];
    return new Response(JSON.stringify({ participants }), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
  
  if (request.method === 'POST') {
    const { participants } = await request.json();
    const success = await setKVData('participants', participants);
    
    if (success) {
      return new Response(JSON.stringify({ 
        message: 'Participantes actualizados exitosamente',
        participants 
      }), {
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }
    
    return new Response(JSON.stringify({ message: 'Error al actualizar participantes' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  return new Response('Method not allowed', { 
    status: 405,
    headers: CORS_HEADERS,
  });
}

// Manejar asignaciones
async function handleAssignments(request: Request): Promise<Response> {
  const url = new URL(request.url);
  
  if (request.method === 'GET') {
    const personId = url.searchParams.get('personId');
    const assignments = await getKVData('assignments') || {};
    
    if (personId) {
      return new Response(JSON.stringify({ 
        assignment: assignments[personId] || null 
      }), {
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }
    
    return new Response(JSON.stringify({ assignments }), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
  
  if (request.method === 'POST') {
    const { participants } = await request.json();
    
    if (!Array.isArray(participants) || participants.length < 2) {
      return new Response(JSON.stringify({ 
        message: 'Se necesitan al menos 2 participantes' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }
    
    // Generar asignaciones aleatorias
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const assignments: Record<string, string> = {};
    
    for (let i = 0; i < participants.length; i++) {
      const giver = participants[i];
      const receiver = shuffled[(i + 1) % shuffled.length];
      assignments[giver] = receiver;
    }
    
    const success = await setKVData('assignments', assignments);
    
    if (success) {
      return new Response(JSON.stringify({ 
        message: 'Asignaciones generadas exitosamente',
        assignments 
      }), {
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }
    
    return new Response(JSON.stringify({ message: 'Error al generar asignaciones' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  return new Response('Method not allowed', { 
    status: 405,
    headers: CORS_HEADERS,
  });
}

// Manejar listas de regalos
async function handleWishlist(request: Request, personId: string): Promise<Response> {
  if (request.method === 'GET') {
    const wishlists = await getKVData('wishlists') || {};
    const gifts = wishlists[personId] || [];
    
    return new Response(JSON.stringify({ gifts }), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
  
  if (request.method === 'POST') {
    const { gifts } = await request.json();
    const wishlists = await getKVData('wishlists') || {};
    wishlists[personId] = gifts;
    
    const success = await setKVData('wishlists', wishlists);
    
    if (success) {
      return new Response(JSON.stringify({ 
        message: 'Lista de regalos actualizada exitosamente',
        gifts 
      }), {
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }
    
    return new Response(JSON.stringify({ message: 'Error al actualizar lista de regalos' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  return new Response('Method not allowed', { 
    status: 405,
    headers: CORS_HEADERS,
  });
}

// Función principal del servidor
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  
  try {
    // Health check
    if (pathSegments.length === 0) {
      return new Response(JSON.stringify({ 
        status: 'ok', 
        family: FAMILY_CODE,
        message: `Familia ${FAMILY_CODE} funcionando correctamente` 
      }), {
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }
    
    // Rutas disponibles:
    // /participants
    // /assignments
    // /wishlist/:personId
    
    if (pathSegments[0] === 'participants') {
      return await handleParticipants(req);
    }
    
    if (pathSegments[0] === 'assignments') {
      return await handleAssignments(req);
    }
    
    if (pathSegments[0] === 'wishlist' && pathSegments[1]) {
      return await handleWishlist(req, pathSegments[1]);
    }
    
    return new Response('Not Found', { 
      status: 404,
      headers: CORS_HEADERS,
    });
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      message: 'Error interno del servidor',
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
});