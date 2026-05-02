'use client';
import { useState } from 'react';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/storefront/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return <div className="text-[#c9a84c] font-bold text-xl py-4">✅ You're subscribed!</div>;
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mt-8">
      <input 
        type="email" 
        value={email}
        onChange={e=>setEmail(e.target.value)}
        placeholder="Enter your email address" 
        required
        disabled={status === 'loading'}
        className="flex-1 bg-white/5 border border-white/10 text-[#faf7f2] px-4 py-3 rounded-lg focus:outline-none focus:border-[#c9a84c]"
      />
      <button 
        type="submit" 
        disabled={status === 'loading'}
        className="bg-[#c9a84c] text-[#1a1a1a] font-bold px-8 py-3 rounded-lg hover:bg-[#b8973d] transition-colors disabled:opacity-50"
      >
        {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
      </button>
      {status === 'error' && <p className="text-red-400 absolute mt-16 text-sm">Failed to subscribe. Try again.</p>}
    </form>
  );
}
