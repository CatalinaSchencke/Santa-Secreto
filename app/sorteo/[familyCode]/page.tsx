'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import FamilyHome from '@/components/FamilyHome';
import FamilySecretFriend from '@/components/FamilySecretFriend';
import FamilyAddGift from '@/components/FamilyAddGift';
import FamilyViewGifts from '@/components/FamilyViewGifts';
import { Navigation } from '@/components/Navigation';

type View = 'home' | 'secret-friend' | 'add-gift' | 'view-gifts';

interface FamilyInfo {
  code: string;
  name: string;
  eventDate?: string;
  maxBudget?: number;
}

export default function FamilyPage() {
  const params = useParams();
  const familyCode = params.familyCode as string;
  const [currentView, setCurrentView] = useState<View>('home');
  const [familyInfo, setFamilyInfo] = useState<FamilyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFamilyInfo = async () => {
      try {
        const response = await fetch(`/api/families/${familyCode}`);
        if (response.ok) {
          const data = await response.json();
          setFamilyInfo(data);
        } else {
          setError('Familia no encontrada');
        }
      } catch (error) {
        setError('Error al cargar información de la familia');
      } finally {
        setIsLoading(false);
      }
    };

    if (familyCode) {
      loadFamilyInfo();
    }
  }, [familyCode]);

  const navigateTo = (view: View) => {
    setCurrentView(view);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-600">Cargando familia...</p>
        </div>
      </div>
    );
  }

  if (error || !familyInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">❌ Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <a 
            href="/" 
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentFamily={familyCode} showOriginalLink={true} />
      
      <div className="min-h-screen">
        {currentView === 'home' && (
          <FamilyHome 
            familyInfo={familyInfo} 
            onNavigate={navigateTo} 
          />
        )}
        {currentView === 'secret-friend' && (
          <FamilySecretFriend 
            familyCode={familyCode} 
            familyName={familyInfo?.name || ''}
            onNavigate={navigateTo} 
          />
        )}
        {currentView === 'add-gift' && (
          <FamilyAddGift 
            familyCode={familyCode}
            familyName={familyInfo?.name || ''}
            onNavigate={navigateTo} 
          />
        )}
        {currentView === 'view-gifts' && (
          <FamilyViewGifts 
            familyCode={familyCode}
            familyName={familyInfo?.name || ''}
            onNavigate={navigateTo} 
          />
        )}
      </div>
    </div>
  );
}