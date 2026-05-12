'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function LoginContent() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loginMode, setLoginMode] = useState<'phone' | 'email'>('phone');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [altPhone, setAltPhone] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const redirectTo = searchParams.get('redirect') || '/account';
  const urlError   = searchParams.get('error');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const sendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStep('otp');
        setCountdown(60);
        toast.success('OTP sent successfully');
      } else {
        toast.error(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
    if (newOtp.every(v => v !== '')) {
      verifyOTP(newOtp.join(''));
    }
  };

  const verifyOTP = async (otpValue: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: otpValue }),
      });
      const data = await res.json();

      if (res.ok) {
        if (data.action === 'login') {
          loginExisting(data.user_id);
        } else {
          setStep('register');
        }
      } else {
        toast.error(data.error || 'Invalid OTP');
      }
    } catch (err) {
      toast.error('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const loginExisting = async (uid: string) => {
    try {
      const res = await fetch('/api/auth/login-existing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: uid }),
      });
      const data = await res.json();
      if (res.ok && data.magic_link_url) {
        window.location.href = data.magic_link_url;
      }
    } catch (err) {
      toast.error('Login failed');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const refCode = typeof window !== 'undefined' ? localStorage.getItem('ref_code') : null;
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          otp: otp.join(''),
          first_name: firstName,
          last_name: lastName,
          email,
          alt_phone: altPhone,
          ref_code: refCode
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Account created successfully!');
        window.location.href = redirectTo;
      } else {
        toast.error(data.error || 'Registration failed');
      }
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-24 max-w-md">
      <div className="bg-white border border-labelwink-cream-border p-10 shadow-2xl rounded-none relative overflow-hidden">
        <div className="text-center mb-10">
          <h1 className="font-heading text-4xl font-bold text-labelwink-green mb-2">LabelWink</h1>
          <p className="text-labelwink-gold text-[10px] uppercase tracking-[0.4em] font-bold">Grace in Every Thread</p>
        </div>

        {step === 'phone' && (
          <div className="space-y-6">
            <div className="flex border-b border-labelwink-cream-border mb-6">
              <button onClick={() => setLoginMode('phone')} className={`flex-1 pb-3 text-[10px] font-bold uppercase tracking-widest ${loginMode === 'phone' ? 'border-b-2 border-labelwink-gold text-labelwink-green' : 'text-labelwink-green/30'}`}>Mobile OTP</button>
              <button onClick={() => setLoginMode('email')} className={`flex-1 pb-3 text-[10px] font-bold uppercase tracking-widest ${loginMode === 'email' ? 'border-b-2 border-labelwink-gold text-labelwink-green' : 'text-labelwink-green/30'}`}>Email Login</button>
            </div>

            {loginMode === 'phone' ? (
              <form onSubmit={sendOTP} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-labelwink-green/40">Mobile Number</Label>
                  <div className="flex border border-labelwink-cream-border rounded-none bg-labelwink-cream-card focus-within:border-labelwink-gold">
                    <span className="px-4 py-3 text-labelwink-green/40 font-medium border-r border-labelwink-cream-border">+91</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="00000 00000"
                      className="flex-1 bg-transparent px-4 py-3 outline-none text-labelwink-green font-medium tracking-widest"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" disabled={loading || phone.length !== 10} className="w-full h-14 bg-labelwink-green text-white rounded-none uppercase tracking-widest font-bold text-xs shadow-lg">
                  {loading ? 'Sending...' : 'Get Secure OTP'}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <Input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="h-12 rounded-none border-labelwink-cream-border bg-labelwink-cream-card" />
                <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="h-12 rounded-none border-labelwink-cream-border bg-labelwink-cream-card" />
                <Button className="w-full h-14 bg-labelwink-green text-white rounded-none uppercase tracking-widest font-bold text-xs shadow-lg">Sign In</Button>
              </div>
            )}
            
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-labelwink-cream-border" /></div>
              <div className="relative flex justify-center text-[9px] uppercase tracking-[0.3em] font-bold">
                <span className="bg-white px-4 text-labelwink-green/30">Or Continue With</span>
              </div>
            </div>

            <Button variant="outline" onClick={loginWithGoogle} className="w-full h-14 border-labelwink-cream-border hover:bg-labelwink-cream-card rounded-none gap-3 text-[10px] font-bold tracking-widest uppercase text-labelwink-green">
              <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
              Google Login
            </Button>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-8 text-center animate-in fade-in duration-500">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-labelwink-green uppercase tracking-wider">Verification</h2>
              <p className="text-[10px] text-labelwink-green/40 uppercase tracking-widest">Sent to +91 {phone}</p>
            </div>
            <div className="flex justify-center gap-2">
              {otp.map((digit, i) => (
                <input
                  key={i} id={`otp-${i}`} type="text" maxLength={1} value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  className="w-12 h-14 bg-labelwink-cream-card border border-labelwink-cream-border text-center text-xl font-bold text-labelwink-green rounded-none outline-none focus:border-labelwink-gold"
                />
              ))}
            </div>
            {countdown > 0 ? (
              <p className="text-[10px] text-labelwink-green/30 uppercase tracking-widest">Resend in {countdown}s</p>
            ) : (
              <button onClick={sendOTP} className="text-[10px] text-labelwink-gold font-bold uppercase tracking-widest hover:underline">Resend OTP</button>
            )}
          </div>
        )}

        {step === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4 animate-in slide-in-from-bottom duration-500">
            <h2 className="text-xl font-bold text-labelwink-green uppercase tracking-wider mb-6">Complete Profile</h2>
            <Input placeholder="First Name*" value={firstName} onChange={e => setFirstName(e.target.value)} className="rounded-none border-labelwink-cream-border bg-labelwink-cream-card h-12" required />
            <Input placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} className="rounded-none border-labelwink-cream-border bg-labelwink-cream-card h-12" />
            <Input type="email" placeholder="Email Address*" value={email} onChange={e => setEmail(e.target.value)} className="rounded-none border-labelwink-cream-border bg-labelwink-cream-card h-12" required />
            <Button type="submit" disabled={loading} className="w-full h-14 bg-labelwink-green text-white rounded-none uppercase tracking-widest font-bold text-xs shadow-lg mt-4">
              {loading ? 'Creating...' : 'Join the Club'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-labelwink-gold" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
