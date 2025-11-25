import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { participants } from '../data/mockData';

interface RouletteAnimationProps {
  winnerName: string;
  onComplete: () => void;
}

export default function RouletteAnimation({ winnerName, onComplete }: RouletteAnimationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(true);
  const names = participants.map(p => p.name);
  const completedRef = useRef(false);
  
  useEffect(() => {
    if (!isSpinning || completedRef.current) return;
    
    let spins = 0;
    const maxSpins = 20;
    let intervalId: NodeJS.Timeout;
    
    const spin = () => {
      intervalId = setInterval(() => {
        spins++;
        
        if (spins >= maxSpins) {
          const winnerIndex = names.indexOf(winnerName);
          setCurrentIndex(winnerIndex);
          setIsSpinning(false);
          clearInterval(intervalId);
          completedRef.current = true;
          
          setTimeout(() => {
            onComplete();
          }, 2000);
        } else {
          setCurrentIndex((prev) => (prev + 1) % names.length);
        }
      }, 100 + spins * 20);
    };
    
    spin();
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <motion.div
        key={currentIndex}
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.1 }}
        className="relative"
      >
        <div className="bg-white rounded-3xl shadow-2xl px-16 py-12 border-4 border-[#ce3b46]">
          <h2 className="text-[#ce3b46] text-center text-5xl font-extrabold">
            {names[currentIndex]}
          </h2>
        </div>
      </motion.div>
      
      {!isSpinning && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <p className="text-white text-center text-xl font-medium">
            ¡Tu amigo secreto es {winnerName}! 🎉
          </p>
        </motion.div>
      )}
      
      {isSpinning && (
        <p className="text-white mt-8 animate-pulse font-medium">
          Buscando tu amigo secreto...
        </p>
      )}
    </div>
  );
}
