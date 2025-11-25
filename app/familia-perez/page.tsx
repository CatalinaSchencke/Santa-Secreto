'use client';

import { useState, useEffect } from 'react';
import Home from '../../components/Home';
import SecretFriend from '../../components/SecretFriend';
import AddGift from '../../components/AddGift';
import ViewGifts from '../../components/ViewGifts';

type View = 'home' | 'secret-friend' | 'add-gift' | 'view-gifts';

export default function FamiliaPerezPage() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [isInitialized, setIsInitialized] = useState(false);

  // Auto-initialize assignments on app startup (for Vercel deployments) - SOLO para familia Perez original
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const { autoInitializeAssignments } = await import('../../data/mockData');
        await autoInitializeAssignments();
        console.log('🎄 Familia Perez initialized successfully for production');
      } catch (error) {
        console.warn('⚠️ Familia Perez initialization had issues, will work on-demand:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    // Initialize the original family on page load
    if (!isInitialized) {
      initializeApp();
    }
  }, [isInitialized]);

  const navigateTo = (view: View) => {
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen">
      {currentView === 'home' && <Home onNavigate={navigateTo} />}
      {currentView === 'secret-friend' && <SecretFriend onNavigate={navigateTo} />}
      {currentView === 'add-gift' && <AddGift onNavigate={navigateTo} />}
      {currentView === 'view-gifts' && <ViewGifts onNavigate={navigateTo} />}
    </div>
  );
}