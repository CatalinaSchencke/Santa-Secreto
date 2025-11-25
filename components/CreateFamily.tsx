import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from './Modal';

export function CreateFamily() {
  const [familyName, setFamilyName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  // Modal states
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Generar código de 6 caracteres memorable
  const generateCode = (familyName: string): string => {
    const cleanName = familyName.toUpperCase().replace(/[^A-Z]/g, '');
    const namePrefix = cleanName.substring(0, 3);
    const numbers = Math.floor(Math.random() * 900) + 100; // 100-999
    return (namePrefix + numbers).substring(0, 6);
  };

  const createFamily = async () => {
    if (!familyName.trim()) {
      setErrorMessage('Por favor ingresa el nombre de la familia');
      setShowErrorModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const code = generateCode(familyName);
      
      // Crear familia en el backend
      const response = await fetch('/api/families/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          name: familyName,
          eventDate: eventDate || null,
          maxBudget: maxBudget ? parseFloat(maxBudget) : null,
        }),
      });

      if (response.ok) {
        const { code: createdCode } = await response.json();
        // Redirigir a la página de la familia
        router.push(`/sorteo/${createdCode}`);
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'Error al crear la familia');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Error al crear la familia');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-gray-700 mb-3 text-lg font-bold">
          Nombre de la Familia *
        </label>
        <input
          type="text"
          value={familyName}
          onChange={(e) => setFamilyName(e.target.value)}
          placeholder="Familia Pérez"
          className="w-full px-5 py-4 rounded-2xl border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ce3b46] focus:border-transparent text-lg font-medium"
        />
      </div>

      <div>
        <label className="block text-gray-700 mb-3 text-lg font-bold">
          Fecha del Evento (opcional)
        </label>
        <input
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className="w-full px-5 py-4 rounded-2xl border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ce3b46] focus:border-transparent text-lg font-medium"
        />
      </div>

      <div>
        <label className="block text-gray-700 mb-3 text-lg font-bold">
          Presupuesto Máximo (opcional)
        </label>
        <input
          type="number"
          value={maxBudget}
          onChange={(e) => setMaxBudget(e.target.value)}
          placeholder="50000"
          className="w-full px-5 py-4 rounded-2xl border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ce3b46] focus:border-transparent text-lg font-medium"
        />
      </div>

      <button
        onClick={createFamily}
        disabled={isLoading}
        className="w-full bg-[#ce3b46] text-white py-4 rounded-full hover:bg-[#b83239] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-xl font-extrabold"
      >
        {isLoading ? 'Creando...' : 'Crear Familia'}
      </button>

      <div className="bg-red-50 border-2 border-[#ce3b46] rounded-2xl p-4 text-center">
        <p className="text-[#ce3b46] font-bold text-sm">
          💡 Se generará un código único de 6 caracteres para compartir con tu familia
        </p>
      </div>
      
      {/* Error Modal */}
      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        onConfirm={() => setShowErrorModal(false)}
        title="Error"
        message={errorMessage}
        confirmText="Aceptar"
      />
    </div>
  );
}