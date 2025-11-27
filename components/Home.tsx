import Image from 'next/image';
import { useState } from 'react';

interface HomeProps {
  onNavigate: (view: 'home' | 'secret-friend' | 'add-gift' | 'view-gifts') => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const [syncLoading, setSyncLoading] = useState(false);

  const handleSyncWithSheets = async () => {
    setSyncLoading(true);
    
    try {
      // Llamar directamente a nuestra API que manejará Google Sheets
      const syncResponse = await fetch('/api/familia-perez/sync-sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (syncResponse.ok) {
        const result = await syncResponse.json();
        alert(`✅ Sincronización exitosa!\nUsuarios actualizados: ${result.stats.totalUsers}\nTotal de regalos: ${result.stats.totalGifts}`);
      } else {
        const errorData = await syncResponse.json();
        throw new Error(errorData.error || 'Error en la sincronización');
      }
      
    } catch (error) {
      console.error('Error sincronizando:', error);
      alert(`❌ Error al sincronizar los regalos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setSyncLoading(false);
    }
  };
  return (
    <div className="bg-[#ce3b46]  min-h-screen py-5 flex justify-around gap-10 flex-col overflow-hidden">
      {/* Header */}
      <div className=" pt-8 lg:p-8 flex justify-center ">
        <h1 className="font-bold text-white text-4xl md:text-5xl w-2/3 text-center ">
          Bienvenida Familia Perez Rojel
        </h1>
      </div>
      <div className="grid lg:grid-cols-2 grid-cols-1 w-full ">
      {/* Gift Image */}


      {/* Content */}
      <div className="flex-1 flex items-center   md:pl-16 px-4 justify-center">
        <div className=" z-10  w-full flex flex-col items-center lg:items-start">
          {/* Tagline */}
          <div className="max-w-xl text-center lg:text-left mb-8 lg:mb-12">
            <p className="font-medium text-white text-lg md:text-4xl">
              <span>No adivines, </span>
              <span className="font-bold">conoce</span>
              <span> exactamente qué </span>
              <span className="font-bold">quiere</span>
              <span> tu Santa Secreto.</span>
            </p>
          </div>
          
          {/* Buttons */}
          <div className="flex flex-col w-full items-center lg:items-start">
            {/* Mobile: stack vertically */}
            <div className="flex flex-col gap-6 w-full sm:w-auto md:hidden">
              <button
                onClick={() => onNavigate('secret-friend')}
                className="bg-white px-12 py-4 rounded-full hover:bg-gray-50 transition-colors"
              >
                <p className="font-extrabold text-[#ce3b46]  whitespace-nowrap">
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
            <div className="hidden md:flex flex-col gap-6 w-full ">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onNavigate('add-gift')}
                  className="bg-white px-6 py-4 rounded-full hover:bg-gray-50 transition-colors"
                >
                  <p className="font-extrabold text-[#ce3b46]  text-lg">
                    Añadir a mi lista de regalos
                  </p>
                </button>
                <button
                  onClick={() => onNavigate('view-gifts')}
                  className="bg-white px-6 py-4 rounded-full hover:bg-gray-50 transition-colors"
                >
                  <p className="font-extrabold text-[#ce3b46]  text-lg">
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
      </div>
      <div className="flex justify-center items-start">
<Image 
          alt="Regalo navideño" 
          className=" object-contain pointer-events-none max-h-[200px] h-auto lg:h-[80%] lg:w-auto w-full max-w-1/2 lg:max-w-full" 
          src="/images/gift.png" 
          width={400}
          height={400}
        />
      </div>
      
      </div>
      
      {/* Footer */}
      <div className="text-center z-10">
        <p className="font-medium text-white text-base md:text-xl w-2/3 mx-auto mb-4">
          Este sitio fue hecho con mucho amor por Catalina.
        </p>
        <button 
          onClick={handleSyncWithSheets}
          disabled={syncLoading}
          className="bg-white px-6 py-3 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <p className="font-bold text-[#ce3b46] text-sm md:text-base">
            {syncLoading ? 'Sincronizando...' : 'Sincronizar Regalos'}
          </p>
        </button>
      </div>
    </div>
  );
}