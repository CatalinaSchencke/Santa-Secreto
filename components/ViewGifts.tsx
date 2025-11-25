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

interface ViewGiftsProps {
  onNavigate: (view: 'home' | 'secret-friend' | 'add-gift' | 'view-gifts') => void;
}

type Step = 'select' | 'results';

export default function ViewGifts({ onNavigate }: ViewGiftsProps) {
  const [step, setStep] = useState<Step>('select');
  const [selectedFriend, setSelectedFriend] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);

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
      const friendGifts = await getGiftWishlist(selectedFriend);
      setGifts(friendGifts);
      setStep('results');
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
      <div className="absolute right-12 bottom-12 hidden lg:block">
        <img src="/images/christmas-tree.png" alt="Árbol navideño" className="w-72 h-auto" />
      </div>
      
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
      
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-3xl">
          {loading ? (
            <div className="bg-white rounded-3xl shadow-2xl p-12 flex flex-col items-center gap-4 max-w-md mx-auto">
              <Spinner size="large" />
              <p className="text-[#ce3b46] font-bold text-xl">Cargando lista de regalos...</p>
            </div>
          ) : step === 'select' ? (
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md mx-auto">
              <h2 className="text-[#ce3b46] text-center mb-3 text-4xl font-bold">
                Ver lista de regalos
              </h2>
              <p className="text-gray-600 text-center mb-8 text-lg font-medium">
                Elige a quién quieres sorprender
              </p>
              
              <div className="mb-8">
                <label htmlFor="friend-select" className="block text-gray-700 mb-3 text-lg font-bold">
                  ¿De quién quieres ver su lista?
                </label>
                <select
                  id="friend-select"
                  value={selectedFriend}
                  onChange={(e) => setSelectedFriend(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ce3b46] focus:border-transparent text-lg font-medium"
                >
                  <option value="">Selecciona una persona</option>
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
                className="w-full bg-[#ce3b46] text-white py-4 rounded-full hover:bg-[#b83239] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-xl font-extrabold mb-4"
              >
                Ver lista de regalos
              </button>
              
              <button
                onClick={handleDiscoverSecretFriend}
                className="w-full bg-white text-[#ce3b46] py-4 rounded-full border-2 border-[#ce3b46] hover:bg-red-50 transition-colors text-xl font-extrabold"
              >
                🎯 Descubrir mi amigo secreto
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[#ce3b46] text-3xl font-bold">
                  Lista de regalos de {selectedFriendName}
                </h2>
                <button
                  onClick={() => setStep('select')}
                  className="text-gray-500 hover:text-[#ce3b46] transition-colors font-medium flex items-center gap-2"
                >
                  <ArrowLeft size={20} />
                  Cambiar persona
                </button>
              </div>
              
              {gifts.length === 0 ? (
                <div className="text-center py-12">
                  <GiftIcon className="mx-auto mb-4 text-gray-300" size={64} />
                  <h3 className="text-2xl font-bold text-gray-600 mb-2">
                    No hay regalos en la lista
                  </h3>
                  <p className="text-gray-500 font-medium">
                    {selectedFriendName} aún no ha añadido ningún regalo a su lista.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {gifts.map((gift, index) => (
                    <div
                      key={gift.id}
                      className="border-2 border-gray-200 rounded-2xl p-6 hover:border-[#ce3b46] transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        {gift.image && (
                          <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-300 flex-shrink-0">
                            <img
                              src={gift.image}
                              alt={gift.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <h3 className="text-gray-800 text-xl font-bold mb-2">
                            {gift.name}
                          </h3>
                          
                          {gift.link && (
                            <a
                              href={gift.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-[#ce3b46] hover:text-[#b83239] transition-colors font-medium"
                            >
                              <ExternalLink size={16} />
                              Ver producto
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-8 p-6 bg-red-50 border-2 border-[#ce3b46] rounded-2xl">
                <p className="text-[#ce3b46] text-center font-bold text-lg mb-2">
                  💰 Máximo de regalo: $30.000 pesos chilenos
                </p>
                <p className="text-gray-700 text-center font-medium">
                  📅 Recuerda llevar tu regalo el 24 de Diciembre en la cena de Navidad de la familia Perez Rojel
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirm}
        title="Confirmación"
        message={(
          <span>
            ¿Quieres ver la lista de regalos de <strong>{selectedFriendName}</strong>?
          </span>
        )}
        confirmText="Sí, ver lista"
        cancelText="Cancelar"
      />
    </div>
  );
}