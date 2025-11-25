'use client';

import { CreateFamily } from '@/components/CreateFamily';
import { useRouter } from 'next/navigation';

export default function CreateFamilyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#ce3b46] flex flex-col relative overflow-hidden">
      {/* Decorative Christmas Tree */}
      <div className="absolute left-12 bottom-12 hidden lg:block">
        <img src="/images/sleigh.png" alt="Trineo navideño" className="w-96 h-auto" />
      </div>
      
      {/* Header */}
      <div className="p-6 lg:p-8 relative z-10 border-b border-white/20 flex justify-center">
        <h1 className="font-bold text-white text-2xl md:text-3xl lg:text-4xl text-center">
          🎄 Santa Secreto
        </h1>
        <button
          onClick={() => router.push('/')}
          className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 text-white hover:text-red-100 transition-colors font-medium"
        >
          <span className="text-xl">←</span>
          <span className="hidden sm:inline">Volver</span>
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full">
          <h2 className="text-[#ce3b46] text-center mb-3 text-3xl font-bold">
            Crear Nueva Familia
          </h2>
          <p className="text-gray-600 text-center mb-8 text-lg font-medium">
            Configura tu sorteo familiar navideño
          </p>
          <CreateFamily />
        </div>
      </div>
    </div>
  );
}