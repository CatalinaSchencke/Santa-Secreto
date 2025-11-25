import { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, Gift as GiftIcon } from 'lucide-react';
import Modal from './Modal';
import Spinner from './Spinner';

interface Participant {
  id: string;
  name: string;
}

interface Gift {
  id: string;
  name: string;
  link?: string;
  image?: string;
}
// import imgChristmasTree from "/images/christmas-tree.png"; // Placeholder for Christmas tree

interface ViewGiftsProps {
  onNavigate: (view: 'home' | 'secret-friend' | 'add-gift' | 'view-gifts') => void;
}

interface Participant {
  id: string;
  name: string;
}

interface Gift {
  id: string;
  name: string;
  link?: string;
  image?: string;
}

type Step = 'select' | 'results';

export default function ViewGifts({ onNavigate }: ViewGiftsProps) {
  const [step, setStep] = useState<Step>('select');
  const [selectedFriend, setSelectedFriend] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);

  // Cargar participantes al montar el componente
  useEffect(() => {
    loadParticipants();
  }, []);

  const loadParticipants = async () => {
    try {
      const response = await fetch('/api/familia-perez/participants');
      const data = await response.json();
      if (response.ok) {
        setParticipants(data.participants || []);
      }
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  const getGiftWishlist = async (person: string): Promise<Gift[]> => {
    try {
      const response = await fetch(`/api/familia-perez/wishlist?person=${encodeURIComponent(person)}`);
      const data = await response.json();
      if (response.ok) {
        return data.gifts || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      return [];
    }
  };
  
  const handleNext = () => {
    if (!selectedFriend) return;
    setShowModal(true);
  };
  
  const handleConfirm = async () => {
    setShowModal(false);
    setLoading(true);
    
    try {
      const person = participants.find(p => p.id === selectedFriend);
      if (person) {
        const response = await fetch(`/api/familia-perez/wishlist?person=${encodeURIComponent(person.name)}`);
        if (response.ok) {
          const data = await response.json();
          setGifts(data);
          setStep('results');
        } else {
          alert('Error al obtener la lista de regalos. Por favor, intenta de nuevo.');
        }
      }
    } catch (error) {
      console.error('Error getting wishlist:', error);
      alert('Error al obtener la lista de regalos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDiscoverSecretFriend = () => {
    onNavigate('secret-friend');
  };
  
  const selectedFriendName = participants.find(p => p.id === selectedFriend)?.name || '';
  
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
            <p className="text-[#ce3b46] font-bold text-xl">Cargando lista de regalos...</p>
          </div>
        ) : step === 'select' ? (
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full">
            <h2 className="text-[#ce3b46] text-center mb-3 text-4xl font-bold">
              Ver lista de regalos
            </h2>
            <p className="text-gray-600 text-center mb-8 text-lg font-medium">
              Selecciona a tu amigo secreto para ver sus regalos deseados
            </p>
            
            <div className="mb-8">
              <label htmlFor="friend-select" className="block text-gray-700 mb-3 text-lg font-bold">
                Selecciona tu amigo secreto
              </label>
              <select
                id="friend-select"
                value={selectedFriend}
                onChange={(e) => setSelectedFriend(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ce3b46] focus:border-transparent text-lg font-medium"
              >
                <option value="">Selecciona un nombre</option>
                {participants.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={handleNext}
              disabled={!selectedFriend}
              className="w-full bg-[#ce3b46] text-white py-4 rounded-full hover:bg-[#b83239] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed mb-4 text-xl font-extrabold"
            >
              Ver lista
            </button>
            
            <button
              onClick={handleDiscoverSecretFriend}
              className="text-[#ce3b46] hover:text-[#b83239] transition-colors mx-auto block underline font-bold"
            >
              ¿No conoces a tu Santa Secreto? Haz click aquí para conocerlo
            </button>
          </div>
        ) : (
          <div className="w-full max-w-3xl">
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
              <div className="text-center mb-8">
                <h2 className="text-[#ce3b46] mb-3 text-3xl font-bold">
                  Lista de regalos de {selectedFriendName}
                </h2>
                <p className="text-gray-600 text-lg font-medium">
                  Estos son los regalos que {selectedFriendName} desea recibir
                </p>
              </div>
              
              {gifts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <GiftIcon size={48} className="text-gray-400" />
                  </div>
                  <p className="text-gray-700 mb-2 text-xl font-bold">
                    {selectedFriendName} aún no ha añadido regalos a su lista
                  </p>
                  <p className="text-gray-500 font-medium">
                    Vuelve a revisar más tarde o pregúntale qué le gustaría recibir
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {gifts.map((gift) => (
                    <div
                      key={gift.id}
                      className="border-2 border-gray-200 rounded-2xl p-6 hover:border-[#ce3b46] transition-colors"
                    >
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Image */}
                        {gift.image && (
                          <div className="flex-shrink-0">
                            <img
                              src={gift.image}
                              alt={gift.name}
                              className="w-full md:w-32 h-32 object-cover rounded-xl"
                            />
                          </div>
                        )}
                        
                        {/* Content */}
                        <div className="flex-1">
                          <h3 className="text-gray-800 mb-3 text-2xl font-bold">
                            {gift.name}
                          </h3>
                          
                          {gift.link && (
                            <a
                              href={gift.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-[#ce3b46] hover:text-[#b83239] transition-colors font-bold"
                            >
                              <ExternalLink size={20} />
                              <span>Ver producto</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button
                  onClick={() => {
                    setStep('select');
                    setSelectedFriend('');
                    setGifts([]);
                  }}
                  className="flex-1 border-2 border-[#ce3b46] text-[#ce3b46] py-4 rounded-full hover:bg-red-50 transition-colors text-xl font-extrabold"
                >
                  Ver otra lista
                </button>
                <button
                  onClick={() => onNavigate('home')}
                  className="flex-1 bg-[#ce3b46] text-white py-4 rounded-full hover:bg-[#b83239] transition-colors text-xl font-extrabold"
                >
                  Volver al inicio
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirm}
        title="Confirmación"
        message={`¿Estás seguro que este es tu amigo secreto?`}
        confirmText="Sí, estoy seguro"
        cancelText="No, volver"
      />
    </div>
  );
}