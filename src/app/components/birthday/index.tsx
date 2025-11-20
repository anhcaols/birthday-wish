'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { birthdayWishes, photos } from './wishes';

const BirthdayScene = dynamic(() => import('./birthday-scene'), {
  ssr: false,
});

export default function Birthday() {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {showContent && (
        <>
          <BirthdayScene messages={birthdayWishes} images={photos} />
          {/* <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-linear-to-r from-pink-400 via-rose-500 to-pink-400 animate-pulse text-center whitespace-nowrap drop-shadow-2xl"
                style={{
                  fontFamily: '"Brush Script MT", cursive',
                  textShadow: '0 0 30px rgba(255, 105, 180, 0.8), 0 0 60px rgba(255, 105, 180, 0.5)',
                }}>
              Happy Birthday! 🎂
            </h1>
          </div> */}
        </>
      )}
    </div>
  );
}
