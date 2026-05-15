'use client';
import { useState } from 'react';
import { Send, Loader2, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface NewsletterSignupProps {
  threshold?: number;
}

export function NewsletterSignup({ threshold = 3499 }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    const { error } = await supabase
      .from('newsletter_subscriptions')
      .insert({ email });

    if (error) {
      if (error.code === '23505') {
        toast.info('You are already subscribed!');
        setStatus('success');
      } else {
        toast.error('Failed to subscribe. Please try again.');
        setStatus('error');
      }
    } else {
      setStatus('success');
      setEmail('');
      toast.success('Welcome to the Wink Club!');
    }
  };

  return (
    <section className="py-24 bg-blush/20 border-y border-sage/10">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-heading text-charcoal mb-4">Join the Wink Club</h2>
          <p className="text-charcoal/70 mb-8 italic">
            Subscribe to receive updates, access to exclusive deals, and more.
          </p>

          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center p-8 bg-white/50 rounded-lg animate-in fade-in zoom-in duration-500 border border-teal/20">
              <CheckCircle2 className="w-12 h-12 text-teal mb-4" />
              <h3 className="text-xl font-semibold text-charcoal">You're on the list!</h3>
              <p className="text-charcoal/60">Watch your inbox for some magic coming your way.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-8 py-5 rounded-xl border border-sage/20 bg-white focus:outline-none focus:ring-2 focus:ring-teal/20 transition-all text-sm shadow-sm"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="bg-charcoal text-white px-10 py-5 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-teal transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-3 shadow-md"
              >
                {status === 'loading' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Subscribe <Send className="w-4 h-4" /></>
                )}
              </button>
            </form>
          )}
          <p className="mt-8 text-[9px] text-charcoal/40 uppercase tracking-[0.3em] font-bold">
            Grace in Every Thread &bull; Label Wink
          </p>
        </div>
      </div>
    </section>
  );
}
