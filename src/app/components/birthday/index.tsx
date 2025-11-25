'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { birthdayWishes, photos } from './wishes';

const BirthdayScene = dynamic(() => import('./birthday-scene'), {
  ssr: false,
});

export default function Birthday() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="relative w-full h-screen overflow-hidden" />
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <BirthdayScene messages={birthdayWishes} images={photos} />
      <div className="fixed top-0 left-0">
        <img src="/images/gau-dau-2.webp" alt="Birthday" className="w-24 h-24 object-cover rounded-br-lg" />
      </div>
      <div className="fixed top-0 right-0">
        <img src="/images/gau-dau-3.jpg" alt="Birthday" className="w-24 h-24 object-cover rounded-bl-lg" />
      </div>
      <div className="fixed bottom-0 left-0">
        <img src="/images/gau-dau-1.webp" alt="Birthday" className="w-24 h-24 object-cover rounded-tr-lg" />
      </div>
      <div className="fixed bottom-0 right-0">
        <img src="/images/gau-dau-4.webp" alt="Birthday" className="w-24 h-24 object-cover rounded-tl-lg" />
      </div>
    </div>
  );
}
