'use client';

import { useState } from 'react';
import { Truck, MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function PincodeChecker() {
  const [pincode, setPincode] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [estimate, setEstimate] = useState<string | null>(null);

  const checkDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.length !== 6) return;

    setStatus('LOADING');
    
    // Simulate API call to Shiprocket or similar
    setTimeout(() => {
      const today = new Date();
      // Simple logic: 3 days for common pincodes, 5 for others
      const daysToAdd = pincode.startsWith('11') || pincode.startsWith('40') || pincode.startsWith('56') ? 3 : 5;
      today.setDate(today.getDate() + daysToAdd);
      
      const dateString = today.toLocaleDateString(undefined, { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
      
      setEstimate(dateString);
      setStatus('SUCCESS');
    }, 800);
  };

  return (
    <div className="bg-sage/5 border border-sage/10 p-5 space-y-4">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal">
        <Truck className="w-4 h-4 text-teal" />
        Delivery Options
      </div>

      <form onSubmit={checkDelivery} className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Enter Pincode"
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full h-11 pl-9 pr-4 bg-white border border-sage/20 text-xs font-medium focus:border-teal outline-none transition-all"
            maxLength={6}
          />
        </div>
        <Button 
          type="submit" 
          disabled={pincode.length !== 6 || status === 'LOADING'}
          className="h-11 px-6 bg-charcoal text-cream rounded-none text-[10px] font-bold uppercase tracking-widest hover:bg-teal transition-colors"
        >
          {status === 'LOADING' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check'}
        </Button>
      </form>

      {status === 'SUCCESS' && estimate && (
        <div className="flex items-start gap-3 pt-2 animate-in fade-in slide-in-from-top-1 duration-300">
          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-charcoal">Estimated delivery by {estimate}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Express Shipping Available</p>
          </div>
        </div>
      )}

      {status === 'ERROR' && (
        <p className="text-[10px] font-bold text-destructive uppercase tracking-wider">Invalid pincode or service unavailable.</p>
      )}
    </div>
  );
}
