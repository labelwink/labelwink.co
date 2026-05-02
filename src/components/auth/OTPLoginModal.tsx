'use client';

import React, { useState, useEffect, useRef, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// CONTEXT
interface AuthModalContextType {
  isOpen: boolean;
  openModal: (returnUrl?: string) => void;
  closeModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
}

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [returnUrl, setReturnUrl] = useState<string | undefined>(undefined);

  const openModal = (url?: string) => {
    setReturnUrl(url);
    setIsOpen(true);
  };
  const closeModal = () => setIsOpen(false);

  return (
    <AuthModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
      <OTPLoginModal 
        isOpen={isOpen} 
        onClose={closeModal} 
        onSuccess={closeModal} 
        returnUrl={returnUrl} 
      />
    </AuthModalContext.Provider>
  );
}

type Step = 'PHONE' | 'OTP' | 'EXISTING' | 'REGISTER';

export default function OTPLoginModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  returnUrl 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: () => void;
  returnUrl?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [userId, setUserId] = useState('');

  // Register form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [altPhone, setAltPhone] = useState('');

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!isOpen) {
      // Reset state on close
      setStep('PHONE');
      setPhone('');
      setOtp(['', '', '', '', '', '']);
      setError('');
      setLoading(false);
      setCountdown(0);
      setFirstName('');
      setLastName('');
      setEmail('');
      setAltPhone('');
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit number');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStep('OTP');
        setCountdown(60);
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple chars
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto submit if all filled
    if (newOtp.every(v => v !== '')) {
      verifyOtp(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    const newOtp = [...otp];
    pastedData.forEach((char, i) => {
      if (i < 6 && /[0-9]/.test(char)) {
        newOtp[i] = char;
      }
    });
    setOtp(newOtp);
    if (newOtp.every(v => v !== '')) {
      verifyOtp(newOtp.join(''));
    } else {
      const nextEmptyIndex = newOtp.findIndex(v => v === '');
      if (nextEmptyIndex !== -1) {
        otpRefs.current[nextEmptyIndex]?.focus();
      }
    }
  };

  const verifyOtp = async (otpValue: string) => {
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
          setUserId(data.user_id);
          setStep('EXISTING');
          loginExisting(data.user_id);
        } else if (data.action === 'register') {
          setStep('REGISTER');
        }
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (err) {
      setError('Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const loginExisting = async (uid: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login-existing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: uid }),
      });
      const data = await res.json();
      
      if (res.ok && data.magic_link_url) {
        onSuccess();
        router.push(data.magic_link_url);
      } else {
        setError(data.error || 'Login failed');
        setStep('PHONE');
      }
    } catch (err) {
      setError('Login failed');
      setStep('PHONE');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!firstName || !email) {
      setError('First name and email are required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          otp: otp.join(''),
          first_name: firstName,
          last_name: lastName,
          email,
          alt_phone: altPhone
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        onSuccess();
        router.push(returnUrl || '/');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (countdown > 0) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setCountdown(60);
      } else {
        setError(data.error || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback${returnUrl ? `?next=${returnUrl}` : ''}`,
      },
    });
    if (error) setError(error.message);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-[#c9a84c]/20 rounded-2xl p-8 w-full max-w-md relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-[#faf7f2]/50 hover:text-[#faf7f2]"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {step === 'PHONE' && (
          <div>
            <h2 className="text-2xl font-bold text-[#faf7f2] mb-1">Sign in to LabelWink</h2>
            <p className="text-[#faf7f2]/70 mb-6 text-sm">Enter your mobile number to continue</p>
            
            <form onSubmit={handlePhoneSubmit}>
              <div className="flex border border-white/10 rounded-lg bg-white/5 focus-within:border-[#c9a84c] focus-within:ring-1 focus-within:ring-[#c9a84c] mb-4 overflow-hidden">
                <div className="flex items-center px-4 border-r border-white/10">
                  <span className="text-lg mr-2">🇮🇳</span>
                  <span className="text-[#faf7f2]">+91</span>
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  className="flex-1 bg-transparent border-none text-[#faf7f2] px-4 py-3 outline-none w-full"
                  placeholder="Mobile Number"
                  required
                />
              </div>
              {error && <p className="text-red-400 text-sm mt-1 mb-3">{error}</p>}
              <button 
                type="submit" 
                disabled={loading || phone.length !== 10}
                className="w-full bg-[#c9a84c] text-[#1a1a1a] font-bold py-3 rounded-lg hover:bg-[#b8973d] transition disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Get OTP'}
              </button>
            </form>

            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-white/10"></div>
              <span className="px-4 text-[#faf7f2]/50 text-sm">or</span>
              <div className="flex-1 border-t border-white/10"></div>
            </div>

            <button 
              onClick={handleGoogleLogin}
              className="w-full border border-white/20 text-[#faf7f2] font-medium py-3 rounded-lg hover:bg-white/5 transition flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
              Continue with Google
            </button>
          </div>
        )}

        {step === 'OTP' && (
          <div>
            <h2 className="text-2xl font-bold text-[#faf7f2] mb-1">Enter OTP</h2>
            <p className="text-[#faf7f2]/70 mb-6 text-sm">
              Sent to +91 {phone.substring(0, 2)}XXXX{phone.substring(6)}
            </p>
            
            <div 
              className="flex justify-between gap-2 mb-4" 
              onPaste={handleOtpPaste}
            >
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { otpRefs.current[i] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-12 h-14 bg-white/5 border border-white/10 text-[#faf7f2] rounded-lg text-center text-xl focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] outline-none"
                  disabled={loading}
                />
              ))}
            </div>
            {error && <p className="text-red-400 text-sm mt-1 mb-3">{error}</p>}
            
            <div className="flex flex-col gap-3 mt-6 text-sm text-center">
              <button 
                onClick={resendOtp} 
                disabled={countdown > 0 || loading}
                className="text-[#c9a84c] hover:underline disabled:opacity-50 disabled:hover:no-underline disabled:text-[#faf7f2]/50"
              >
                {countdown > 0 ? `Resend in 0:${countdown.toString().padStart(2, '0')}` : 'Resend OTP'}
              </button>
              
              <button 
                onClick={() => setStep('PHONE')}
                className="text-[#faf7f2]/50 hover:text-[#faf7f2]"
              >
                &larr; Change number
              </button>
            </div>
          </div>
        )}

        {step === 'EXISTING' && (
          <div className="text-center py-8">
            <h2 className="text-xl font-bold text-[#faf7f2] mb-4">Welcome back! Signing you in...</h2>
            <div className="w-8 h-8 border-4 border-[#c9a84c] border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        )}

        {step === 'REGISTER' && (
          <div>
            <h2 className="text-2xl font-bold text-[#faf7f2] mb-1">Create Your Account</h2>
            <p className="text-[#faf7f2]/70 mb-6 text-sm">Just a few details to get started</p>
            
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="First Name*"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-[#faf7f2] rounded-lg px-4 py-3 focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-[#faf7f2] rounded-lg px-4 py-3 focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] outline-none"
                />
              </div>
              <input
                type="email"
                placeholder="Email ID*"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-[#faf7f2] rounded-lg px-4 py-3 focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] outline-none"
                required
              />
              <input
                type="tel"
                placeholder="Alternative Phone (Optional)"
                value={altPhone}
                onChange={(e) => setAltPhone(e.target.value.replace(/[^0-9]/g, ''))}
                maxLength={10}
                className="w-full bg-white/5 border border-white/10 text-[#faf7f2] rounded-lg px-4 py-3 focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] outline-none"
              />
              {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#c9a84c] text-[#1a1a1a] font-bold py-3 rounded-lg hover:bg-[#b8973d] transition disabled:opacity-50 mt-4"
              >
                {loading ? 'Creating Account...' : 'Create Account & Continue'}
              </button>
            </form>
            
            <button 
              onClick={() => setStep('PHONE')}
              className="text-[#faf7f2]/50 hover:text-[#faf7f2] mt-6 w-full text-center text-sm"
            >
              &larr; Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
