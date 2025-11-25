'use client';

import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import Modal from './Modal';

interface FamilyInfo {
  code: string;
  name: string;
  eventDate?: string;
  maxBudget?: number;
}

interface FamilyHomeProps {
  familyInfo: FamilyInfo;
  onNavigate: (view: 'home' | 'secret-friend' | 'add-gift' | 'view-gifts') => void;
}

interface Participant {
  id: string;
  name: string;
}

export default function FamilyHome({ familyInfo, onNavigate }: FamilyHomeProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(true);
  
  // Modal states
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | ReactNode>('');
  const [modalTitle, setModalTitle] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  // Función para cargar participantes
  const loadParticipants = useCallback(async () => {
    try {
      const apiPath = familyInfo.code === 'PEREZ' 
        ? '/api/familia-perez/participants' 
        : `/api/families/${familyInfo.code}/participants`;
        
      const response = await fetch(apiPath);
      if (response.ok) {
        const data = await response.json();
        setParticipants(data);
      }
    } catch (error) {
      console.error('Error loading participants:', error);
    } finally {
      setIsLoadingParticipants(false);
    }
  }, [familyInfo.code]);

  // Cargar participantes existentes
  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  const addParticipant = async () => {
    if (!newParticipantName.trim()) {
      setModalTitle('Campo requerido');
      setModalMessage('Por favor ingresa un nombre');
      setShowErrorModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const apiPath = familyInfo.code === 'PEREZ' 
        ? '/api/familia-perez/participants' 
        : `/api/families/${familyInfo.code}/participants`;
        
      const response = await fetch(apiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newParticipantName.trim(),
        }),
      });

      if (response.ok) {
        await loadParticipants();
        setNewParticipantName('');
      } else {
        const error = await response.json();
        setModalTitle('Error');
        setModalMessage(error.message || 'Error al agregar participante');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error adding participant:', error);
      setModalTitle('Error');
      setModalMessage('Error al agregar participante');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAssignments = async () => {
    if (participants.length < 2) {
      setModalTitle('Participantes insuficientes');
      setModalMessage('Necesitas al menos 2 participantes para hacer el sorteo');
      setShowErrorModal(true);
      return;
    }

    setModalTitle('Confirmar sorteo');
    setModalMessage(
      <span>
        ¿Generar sorteo para <strong className="text-[#ce3b46]">{participants.length}</strong> participantes?
      </span>
    );
    setConfirmAction(() => () => performGenerateAssignments());
    setShowConfirmModal(true);
  };

  const performGenerateAssignments = async () => {

    setIsLoading(true);
    try {
      const apiPath = familyInfo.code === 'PEREZ' 
        ? '/api/familia-perez/assignments' 
        : `/api/families/${familyInfo.code}/assignments`;
        
      const response = await fetch(apiPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ regenerate: false }),
      });

      if (response.ok) {
        setModalTitle('¡Éxito!');
        setModalMessage('¡Sorteo generado exitosamente!');
        setShowSuccessModal(true);
      } else {
        const error = await response.json();
        setModalTitle('Error');
        setModalMessage(error.message || 'Error al generar sorteo');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error generating assignments:', error);
      setModalTitle('Error');
      setModalMessage('Error al generar sorteo');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#ce3b46] min-h-screen py-5 flex flex-col justify-around gap-10  overflow-hidden">

      
      {/* Header */}
      <div className="p-6 lg:p-8 flex gap-5 justify-center">
        <div className="flex flex-col lg:flex-row items-center  gap-10 justify-center  w-full ">
            
            <div className="flex flex-col items-center  gap-5 lg:w-1/2 w-2/3">
        <h1 className="font-bold text-white text-4xl md:text-5xl text-center">
          Bienvenida {familyInfo.name}
        </h1>
                          {/* Buttons */}
            <div className="flex flex-col w-full justify-center col-span-2 place-items-center ">
                 
            
              {/* Mobile: stack vertically */}
              <div className="col-span-2 flex flex-col gap-6 w-full sm:w-auto md:hidden ">
                <button
                  onClick={() => onNavigate('secret-friend')}
                  className="bg-white px-12 py-4 rounded-full hover:bg-gray-50 transition-colors"
                >
                  <p className="font-extrabold text-[#ce3b46] whitespace-nowrap">
                    Ver mi amigo secreto
                  </p>
                </button>
                <button
                  onClick={() => onNavigate('view-gifts')}
                  className="bg-white px-12 py-4 rounded-full hover:bg-gray-50 transition-colors"
                >
                  <p className="font-extrabold text-[#ce3b46] whitespace-nowrap">
                    Ver lista de regalos
                  </p>
                </button>
                <button
                  onClick={() => onNavigate('add-gift')}
                  className="bg-white px-12 py-4 rounded-full hover:bg-gray-50 transition-colors"
                >
                  <p className="font-extrabold text-[#ce3b46] whitespace-nowrap">
                    Añadir a mi lista de regalos
                  </p>
                </button>
              </div>
              
              {/* Desktop: 2 on top, 1 on bottom with same width */}
              <div className="hidden col-span-2 md:flex flex-col gap-6 max-w-3/4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => onNavigate('add-gift')}
                    className="bg-white px-6 py-4 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-extrabold text-[#ce3b46] text-lg">
                      Añadir a mi lista de regalos
                    </p>
                  </button>
                  <button
                    onClick={() => onNavigate('view-gifts')}
                    className="bg-white px-6 py-4 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-extrabold text-[#ce3b46] text-lg">
                      Ver lista de regalos
                    </p>
                  </button>
                </div>
                <div className="grid grid-cols-1">
                  <button
                    onClick={() => onNavigate('secret-friend')}
                    className="bg-white px-6 py-4 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-extrabold text-[#ce3b46] text-lg">
                      Ver mi amigo secreto
                    </p>
                  </button>
                </div>
              </div>

        </div>
        </div>
            {/* Family Info */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 lg:h-full flex flex-col justify-center items-center mx-auto w-full lg:w-1/2">
              <h2 className="text-[#ce3b46] text-center mb-6 text-3xl font-bold">
                Información de la Familia
              </h2>
              <div className="space-y-3 text-center">
                <p className="text-gray-600 text-lg">
                  <span className="font-bold">Código:</span> 
                  <span className="font-mono font-semibold text-[#ce3b46] ml-2">{familyInfo.code}</span>
                </p>
                {familyInfo.eventDate && (
                  <p className="text-gray-600 text-lg">
                    <span className="font-bold">📅 Evento:</span> {new Date(familyInfo.eventDate).toLocaleDateString()}
                  </p>
                )}
                {familyInfo.maxBudget && (
                  <p className="text-gray-600 text-lg">
                    <span className="font-bold">💰 Presupuesto:</span> ${familyInfo.maxBudget.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
      </div>
      </div>

        <div className="flex flex-col lg:space-x-8 gap-8 items-center h-full justify-center">

            {/* Participantes */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 w-3/4 lg:h-full ">
              <h2 className="text-[#ce3b46] text-center mb-6 text-3xl font-bold">
                👥 Participantes ({participants.length})
              </h2>
              
              {/* Agregar participante */}
              <div className="mb-6">
                <input
                  type="text"
                  value={newParticipantName}
                  onChange={(e) => setNewParticipantName(e.target.value)}
                  placeholder="Nombre del participante"
                  className="w-full px-5 py-4 rounded-2xl border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ce3b46] focus:border-transparent text-lg font-medium mb-4"
                  onKeyPress={(e) => e.key === 'Enter' && addParticipant()}
                />
                <button
                  onClick={addParticipant}
                  disabled={isLoading}
                  className="w-full bg-[#ce3b46] text-white py-4 rounded-full hover:bg-[#b83239] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-xl font-extrabold"
                >
                  {isLoading ? 'Agregando...' : 'Agregar Participante'}
                </button>
              </div>

              {/* Lista de participantes */}
              {isLoadingParticipants ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#ce3b46] mx-auto"></div>
                  <p className="text-[#ce3b46] font-bold text-lg mt-4">Cargando...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {participants.length > 0 ? (
                    participants.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between bg-red-50 p-4 rounded-2xl">
                        <span className="font-bold text-[#ce3b46] text-lg">{participant.name}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4 text-lg font-medium">
                      No hay participantes aún
                    </p>
                  )}
                </div>
              )}

              {participants.length >= 2 && (
                <button
                  onClick={generateAssignments}
                  disabled={isLoading}
                  className="w-full mt-6 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-extrabold py-4 rounded-full text-xl transition-colors"
                >
                  🎲 Generar Sorteo
                </button>
              )}
            </div>

           

            </div>

      
      {/* Footer */}
      <div className="text-center z-10">
        <p className="font-medium text-white text-base md:text-xl">
          Comparte este código con tu familia: <span className="font-mono font-bold">{familyInfo.code}</span>
        </p>
      </div>
      
      {/* Modals */}
      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        onConfirm={() => setShowErrorModal(false)}
        title={modalTitle}
        message={modalMessage}
        confirmText="Aceptar"
      />
      
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        onConfirm={() => setShowSuccessModal(false)}
        title={modalTitle}
        message={modalMessage}
        confirmText="Aceptar"
      />
      
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => {
          setShowConfirmModal(false);
          confirmAction();
        }}
        title={modalTitle}
        message={modalMessage}
        confirmText="Sí, generar"
        cancelText="Cancelar"
      />
    </div>
  );
}