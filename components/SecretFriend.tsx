import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import Modal from './Modal';
import RouletteAnimation from './RouletteAnimation';
import Spinner from './Spinner';

interface SecretFriendProps {
  onNavigate: (view: 'home' | 'secret-friend' | 'add-gift' | 'view-gifts') => void;
}

interface Participant {
  id: string;
  name: string;
}

type Step = 'select' | 'confirm' | 'roulette' | 'result';

export default function SecretFriend({ onNavigate }: SecretFriendProps) {
  const [step, setStep] = useState<Step>('select');
  const [selectedPerson, setSelectedPerson] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [secretFriend, setSecretFriend] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);

  // Load participants from API
  useEffect(() => {
    const loadParticipants = async () => {
      try {
        const response = await fetch('/api/familia-perez/participants');
        if (response.ok) {
          const data = await response.json();
          setParticipants(data);
        }
      } catch (error) {
        console.error('Error loading participants:', error);
      }
    };
    loadParticipants();
  }, []);
  
  const handleNext = () => {
    if (!selectedPerson) return;
    setShowModal(true);
  };
  
  const handleConfirm = async () => {
    setShowModal(false);
    setLoading(true);
    
    try {
      const person = participants.find(p => p.id === selectedPerson);
      if (person) {
        const response = await fetch(`/api/familia-perez/assignments?person=${encodeURIComponent(person.name)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.secretFriend) {
            setSecretFriend(data.secretFriend);
            setStep('roulette');
          } else {
            alert('No se encontró asignación. Asegúrate de que se haya generado el sorteo.');
          }
        } else {
          const error = await response.json();
          alert(error.error || 'Error al obtener tu amigo secreto.');
        }
      }
    } catch (error) {
      console.error('Error getting secret friend:', error);
      alert('Error al obtener tu amigo secreto. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRouletteComplete = () => {
    setStep('result');
  };
  
  const selectedPersonName = participants.find(p => p.id === selectedPerson)?.name || '';
  
  return (
    <div className="min-h-screen bg-[#ce3b46] flex flex-col relative overflow-hidden">
      {/* Decorative Christmas Tree */}
      <div className="absolute right-12 bottom-12 hidden lg:block">
        <img src="/images/christmas-tree.png" alt="Árbol de Navidad" className="w-80 h-auto" />
      </div>
      
      {/* Header */}
      <div className="p-6 lg:p-8 relative z-10 border-b border-white/20 flex justify-center">
        <h1 className="font-bold text-white text-2xl md:text-3xl lg:text-4xl text-center max-w-[50%]">
          Bienvenida Familia Perez Rojel
        </h1>
        <button
          onClick={() => onNavigate('home')}
          className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 text-white hover:text-red-100 transition-colors font-medium"
        >
          <ArrowLeft size={24} />
          <span className="hidden sm:inline">Volver</span>
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        {loading ? (
          <div className="bg-white rounded-3xl shadow-2xl p-12 flex flex-col items-center gap-4">
            <Spinner size="large" />
            <p className="text-[#ce3b46] font-bold text-xl">Cargando...</p>
          </div>
        ) : step === 'select' ? (
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full">
            <h2 className="text-[#ce3b46] text-center mb-3 text-4xl font-bold">
              Conoce tu amigo secreto
            </h2>
            <p className="text-gray-600 text-center mb-8 text-lg font-medium">
              Primero, necesitamos saber quién eres
            </p>
            
            <div className="mb-8">
              <label htmlFor="person-select" className="block text-gray-700 mb-3 text-lg font-bold">
                ¿Quién eres?
              </label>
              <select
                id="person-select"
                value={selectedPerson}
                onChange={(e) => setSelectedPerson(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ce3b46] focus:border-transparent text-lg font-medium"
              >
                <option value="">Selecciona tu nombre</option>
                {participants.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={handleNext}
              disabled={!selectedPerson}
              className="w-full bg-[#ce3b46] text-white py-4 rounded-full hover:bg-[#b83239] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-xl font-extrabold"
            >
              Siguiente
            </button>
          </div>
        ) : step === 'roulette' ? (
          <RouletteAnimation
            winnerName={secretFriend}
            participants={participants.map(p => p.name)}
            onComplete={handleRouletteComplete}
          />
        ) : step === 'result' ? (
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full text-center">
            <div className="mb-6">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl">🎁</span>
              </div>
              <h2 className="text-[#ce3b46] mb-6 text-3xl font-bold">
                ¡Tu amigo secreto es!
              </h2>
              <div className="bg-red-50 rounded-2xl p-8 mb-6">
                <p className="text-[#ce3b46] text-4xl font-extrabold">{secretFriend}</p>
              </div>
              <p className="text-gray-600 text-lg font-medium">
                Ahora puedes ver su lista de regalos deseados para encontrar el regalo perfecto
              </p>
            </div>
            
            <div className="flex flex-col gap-4">
              <button
                onClick={() => onNavigate('view-gifts')}
                className="w-full bg-[#ce3b46] text-white py-4 rounded-full hover:bg-[#b83239] transition-colors text-xl font-extrabold"
              >
                Ver lista de regalos
              </button>
              <button
                onClick={() => onNavigate('home')}
                className="w-full border-2 border-[#ce3b46] text-[#ce3b46] py-4 rounded-full hover:bg-red-50 transition-colors text-xl font-extrabold"
              >
                Volver al inicio
              </button>
            </div>
          </div>
        ) : null}
      </div>
      
      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirm}
        title="Confirmación"
        message={(
          <span>
            ¿Estás seguro que eres <strong>{selectedPersonName}</strong>?
          </span>
        )}
        confirmText="Sí, soy yo"
        cancelText="No, volver"
      />
    </div>
  );
}