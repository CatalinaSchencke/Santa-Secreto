'use client';

export default function Page() {
  return (
    <div className="min-h-screen bg-[#ce3b46] flex flex-col relative overflow-hidden">
      {/* Decorative Christmas Tree */}
      <div className="absolute right-12 bottom-12 hidden lg:block">
        <img src="/images/christmas-tree.png" alt="Árbol de Navidad" className="w-80 h-auto" />
      </div>
      
      {/* Header */}
      <div className="p-6 lg:p-8 relative z-10 border-b border-white/20 flex justify-center">
        <h1 className="font-bold text-white text-2xl md:text-3xl lg:text-4xl text-center">
          🎅 Santa Secreto
        </h1>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full">
          <h2 className="text-[#ce3b46] text-center mb-3 text-4xl font-bold">
            Bienvenido
          </h2>
          <p className="text-gray-600 text-center mb-8 text-lg font-medium">
            Organiza tu intercambio navideño de manera fácil y divertida
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => window.location.href = '/familia-perez'}
              className="w-full bg-[#ce3b46] text-white py-4 rounded-full hover:bg-[#b83239] transition-colors text-xl font-extrabold"
            >
              🏠 Familia Perez Rojel
            </button>
            
            <button
              onClick={() => window.location.href = '/crear-familia'}
              className="w-full border-2 border-[#ce3b46] text-[#ce3b46] py-4 rounded-full hover:bg-red-50 transition-colors text-xl font-extrabold"
            >
              ➕ Crear Nuevo Sorteo
            </button>
          </div>
          
          <div className="text-center mt-8 p-4 bg-red-50 rounded-2xl">
            <p className="text-gray-700 font-bold mb-1">¿Ya tienes un código de sorteo?</p>
            <p className="text-[#ce3b46] font-mono font-semibold">Visita /sorteo/TU-CODIGO</p>
          </div>
        </div>
      </div>
    </div>
  );
}