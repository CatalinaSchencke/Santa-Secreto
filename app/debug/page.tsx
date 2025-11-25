'use client';

import { useState } from 'react';
import { forceRegenerateAssignments, debugAssignments } from '../services/api';

export default function DebugPage() {
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleDebug = async () => {
    setLoading(true);
    try {
      const data = await debugAssignments();
      setDebugData(data);
    } catch (error) {
      console.error('Debug failed:', error);
      alert('Error en debug: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      const result = await forceRegenerateAssignments();
      console.log('Regeneration result:', result);
      alert('¡Assignments regenerados! Total participantes: ' + result.totalParticipants);
      // Refresh debug data
      await handleDebug();
    } catch (error) {
      console.error('Regeneration failed:', error);
      alert('Error en regeneración: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Debug Santa Secreto</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleDebug}
              disabled={loading}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Ver Estado Actual'}
            </button>
            
            <button
              onClick={handleRegenerate}
              disabled={loading}
              className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? 'Regenerando...' : 'Forzar Nuevo Sorteo'}
            </button>
          </div>

          {debugData && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">Estado Actual:</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Participantes ({debugData.totalParticipants})</h3>
                  <ul className="text-sm bg-white rounded p-3 max-h-40 overflow-y-auto">
                    {debugData.participants?.map((p: any) => (
                      <li key={p.id} className="py-1">
                        {p.id}: {p.name}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Assignments ({debugData.assignmentsCount})</h3>
                  <ul className="text-sm bg-white rounded p-3 max-h-40 overflow-y-auto">
                    {debugData.assignments?.map((a: any, index: number) => {
                      const person = debugData.participants?.find((p: any) => p.id === a.personId);
                      const secretFriend = debugData.participants?.find((p: any) => p.id === a.secretFriendId);
                      return (
                        <li key={index} className="py-1">
                          {person?.name} → {secretFriend?.name}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-500">
                Última actualización: {debugData.timestamp}
              </div>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Instrucciones:</h3>
          <ol className="text-yellow-700 text-sm list-decimal list-inside space-y-1">
            <li>Haz clic en "Ver Estado Actual" para verificar cuántos participantes hay</li>
            <li>Si hay menos de 10 participantes, haz clic en "Forzar Nuevo Sorteo"</li>
            <li>Verifica que ahora aparezcan todos los 10 participantes</li>
            <li>Regresa a la aplicación principal para probar</li>
          </ol>
        </div>
      </div>
    </div>
  );
}