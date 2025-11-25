'use client';

import { useState } from 'react';
import Home from '../../components/Home';
import SecretFriend from '../../components/SecretFriend';
import AddGift from '../../components/AddGift';
import ViewGifts from '../../components/ViewGifts';

type View = 'home' | 'secret-friend' | 'add-gift' | 'view-gifts';

export default function FamiliaPerezPage() {
  const [currentView, setCurrentView] = useState<View>('home');

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