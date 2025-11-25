import { useState } from 'react';
import { ArrowLeft, Upload, X } from 'lucide-react';
import Modal from './Modal';
import Spinner from './Spinner';
import { participants, addGiftsToWishlist, Gift, getGiftWishlist } from '../data/mockData';
interface AddGiftProps {
  onNavigate: (view: 'home' | 'secret-friend' | 'add-gift' | 'view-gifts') => void;
}

type Step = 'select' | 'form';

interface GiftForm {
  name: string;
  link: string;
  image: string;
}

export default function AddGift({ onNavigate }: AddGiftProps) {
  const [step, setStep] = useState<Step>('select');
  const [selectedPerson, setSelectedPerson] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasExistingGifts, setHasExistingGifts] = useState(false);
  
  const [gifts, setGifts] = useState<GiftForm[]>([
    { name: '', link: '', image: '' },
    { name: '', link: '', image: '' },
    { name: '', link: '', image: '' },
  ]);
  
  const handleNext = () => {
    if (!selectedPerson) return;
    setShowModal(true);
  };
  
  const handleConfirm = async () => {
    setShowModal(false);
    setLoading(true);
    
    try {
      // Load existing gifts if any
      const existingGifts = await getGiftWishlist(selectedPerson);
      
      if (existingGifts.length > 0) {
        setHasExistingGifts(true);
        // Pre-populate form with existing gifts
        const formGifts: GiftForm[] = [
          { name: '', link: '', image: '' },
          { name: '', link: '', image: '' },
          { name: '', link: '', image: '' },
        ];
        
        existingGifts.forEach((gift, index) => {
          if (index < 3) {
            formGifts[index] = {
              name: gift.name,
              link: gift.link || '',
              image: gift.image || '',
            };
          }
        });
        
        setGifts(formGifts);
      } else {
        setHasExistingGifts(false);
      }
      
      setStep('form');
    } catch (error) {
      console.error('Error loading existing gifts:', error);
      // Continue to form even if there's an error
      setStep('form');
    } finally {
      setLoading(false);
    }
  };
  
  const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newGifts = [...gifts];
        newGifts[index].image = reader.result as string;
        setGifts(newGifts);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveImage = (index: number) => {
    const newGifts = [...gifts];
    newGifts[index].image = '';
    setGifts(newGifts);
  };
  
  const handleGiftChange = (index: number, field: keyof GiftForm, value: string) => {
    const newGifts = [...gifts];
    newGifts[index][field] = value;
    setGifts(newGifts);
  };
  
  const handleClearGift = (index: number) => {
    const newGifts = [...gifts];
    newGifts[index] = { name: '', link: '', image: '' };
    setGifts(newGifts);
  };
  
  const handleSubmit = async () => {
    const validGifts = gifts
      .filter(g => g.name.trim() !== '')
      .map((g, idx) => ({
        id: `gift-${Date.now()}-${idx}`,
        name: g.name,
        link: g.link || undefined,
        image: g.image || undefined,
      }));
    
    if (validGifts.length === 0) {
      alert('Por favor, añade al menos un regalo con nombre');
      return;
    }
    
    setLoading(true);
    try {
      await addGiftsToWishlist(selectedPerson, validGifts);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error saving wishlist:', error);
      alert('Error al guardar la lista de regalos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSuccessConfirm = () => {
    setShowSuccessModal(false);
    onNavigate('home');
  };
  
  const selectedPersonName = participants.find(p => p.id === selectedPerson)?.name || '';
  const isFormValid = gifts.some(g => g.name.trim() !== '');
  
  return (
    <div className="min-h-screen bg-[#ce3b46] flex flex-col relative overflow-hidden">
      {/* Decorative Image */}
      <div className="absolute left-12 bottom-12 hidden lg:block">
        <img src="/images/sleigh.png" alt="Trineo navideño" className="w-96 h-auto" />
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
        <div className="w-full max-w-3xl">
          {loading && step === 'select' ? (
            <div className="bg-white rounded-3xl shadow-2xl p-12 flex flex-col items-center gap-4 max-w-md mx-auto">
              <Spinner size="large" />
              <p className="text-[#ce3b46] font-bold text-xl">Cargando tus regalos...</p>
            </div>
          ) : step === 'select' ? (
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md mx-auto">
              <h2 className="text-[#ce3b46] text-center mb-3 text-4xl font-bold">
                Añade tu lista de regalos
              </h2>
              <p className="text-gray-600 text-center mb-8 text-lg font-medium">
                Cuéntanos qué te gustaría recibir
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
          ) : (
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
              <h2 className="text-[#ce3b46] text-center mb-3 text-3xl font-bold">
                Añade tus regalos deseados
              </h2>
              <p className="text-gray-600 text-center mb-4 text-lg font-medium">
                Puedes añadir hasta 3 opciones de regalo
              </p>
              
              {/* Budget reminder */}
              <div className="bg-red-50 border-2 border-[#ce3b46] rounded-2xl p-6 mb-8">
                <p className="text-[#ce3b46] text-center font-bold text-lg mb-2">
                  💰 Máximo de regalo: $30.000 pesos chilenos
                </p>
                <p className="text-gray-700 text-center font-medium">
                  📅 Recuerda llevar tu regalo el 24 de Diciembre en la cena de Navidad de la familia Perez Rojel
                </p>
              </div>
              
              <div className="space-y-6">
                {gifts.map((gift, index) => (
                  <div
                    key={index}
                    className="border-2 border-gray-200 rounded-2xl p-6 hover:border-[#ce3b46] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-gray-800 text-xl font-bold">
                        Regalo {index + 1}
                        {index === 0 && <span className="text-[#ce3b46] ml-2">*</span>}
                        {index > 0 && <span className="text-gray-400 text-base ml-2 font-medium">(opcional)</span>}
                      </h3>
                      
                      <button
                        onClick={() => handleClearGift(index)}
                        className="text-gray-400 hover:text-[#ce3b46] transition-colors"
                      >
                        Limpiar
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label htmlFor={`gift-name-${index}`} className="block text-gray-700 mb-2 font-bold">
                          Nombre del producto
                        </label>
                        <input
                          id={`gift-name-${index}`}
                          type="text"
                          value={gift.name}
                          onChange={(e) => handleGiftChange(index, 'name', e.target.value)}
                          placeholder="Ej: Libro de cocina"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ce3b46] focus:border-transparent font-medium"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor={`gift-link-${index}`} className="block text-gray-700 mb-2 font-bold">
                          Link del producto <span className="text-gray-400 font-medium">(opcional)</span>
                        </label>
                        <input
                          id={`gift-link-${index}`}
                          type="url"
                          value={gift.link}
                          onChange={(e) => handleGiftChange(index, 'link', e.target.value)}
                          placeholder="https://ejemplo.com/producto"
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ce3b46] focus:border-transparent font-medium"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 mb-2 font-bold">
                          Imagen <span className="text-gray-400 font-medium">(opcional)</span>
                        </label>
                        {!gift.image ? (
                          <label
                            htmlFor={`gift-image-${index}`}
                            className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#ce3b46] hover:bg-red-50 transition-colors"
                          >
                            <Upload className="text-gray-400 mb-2" size={32} />
                            <span className="text-gray-500 font-medium">
                              Click para subir imagen
                            </span>
                            <input
                              id={`gift-image-${index}`}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(index, e)}
                              className="hidden"
                            />
                          </label>
                        ) : (
                          <div className="relative w-full h-32 rounded-xl overflow-hidden border-2 border-gray-300">
                            <img
                              src={gift.image}
                              alt={gift.name}
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-2 right-2 bg-[#ce3b46] text-white p-1 rounded-full hover:bg-[#b83239] transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={handleSubmit}
                disabled={!isFormValid || loading}
                className="w-full bg-[#ce3b46] text-white py-4 rounded-full hover:bg-[#b83239] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed mt-8 text-xl font-extrabold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Spinner size="small" color="white" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  'Guardar lista de regalos'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Confirmation Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirm}
        title="Confirmación"
        message={`¿Estás seguro que eres ${selectedPersonName}?`}
        confirmText="Sí, soy yo"
        cancelText="No, volver"
      />
      
      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={handleSuccessConfirm}
        onConfirm={handleSuccessConfirm}
        title="¡Éxito!"
        message={hasExistingGifts 
          ? "Tu lista de regalos ha sido actualizada correctamente." 
          : "Tu lista de regalos ha sido guardada correctamente."}
        confirmText="Volver al inicio"
        cancelText="Cerrar"
      />
    </div>
  );
}