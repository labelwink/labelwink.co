'use client';
import { useState, useEffect } from 'react';

export function FlashSaleBanner({ flashSale }: { flashSale: any }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!flashSale?.ends_at) return;
    
    const target = new Date(flashSale.ends_at).getTime();
    
    const update = () => {
      const now = new Date().getTime();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft('Ended');
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [flashSale]);

  if (!flashSale || timeLeft === 'Ended') return null;

  return (
    <div className="w-full bg-gradient-to-r from-red-600 to-[#c9a84c] text-[#faf7f2] py-3 px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-2">
      <div className="font-bold text-lg md:text-xl flex items-center gap-2">
        <span>⚡</span> {flashSale.title} — {flashSale.discount_percent}% OFF
      </div>
      <div className="font-mono font-bold bg-black/20 px-4 py-1 rounded-lg">
        Ends in: {timeLeft}
      </div>
    </div>
  );
}
