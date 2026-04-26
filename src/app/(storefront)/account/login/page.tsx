'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function LoginContent() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const redirectTo = searchParams.get('redirect') || '/account';

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const sendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error('Enter a valid 10-digit Indian mobile number');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: `+91${phone}`,
      options: { channel: 'sms' }
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setStep('otp');
    setCountdown(60);
    setLoading(false);
    toast.success('OTP sent successfully');
  };

  const verifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      phone: `+91${phone}`,
      token: otp,
      type: 'sms'
    });

    if (error) {
      toast.error('Invalid or expired OTP. Please try again.');
      setLoading(false);
      return;
    }

    toast.success('Welcome back!');
    router.push(redirectTo);
    router.refresh();
  };

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${redirectTo}`
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-24 max-w-md">
      <div className="bg-white border border-sage/20 p-10 shadow-sm rounded-sm">
        <div className="text-center mb-10">
          <h1 className="font-heading text-4xl font-semibold text-charcoal mb-2">Welcome Back</h1>
          <p className="text-muted-foreground text-xs uppercase tracking-widest">Growth-stage fashion for you</p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={sendOTP} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-widest text-charcoal/60">Mobile Number</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/40 text-sm font-medium">+91</span>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                  className="h-14 pl-14 bg-sage/5 border-sage/20 focus-visible:ring-teal text-lg tracking-wider"
                />
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={loading || phone.length < 10} 
              className="w-full h-14 bg-charcoal text-cream rounded-none uppercase tracking-[0.2em] font-bold text-xs hover:bg-teal transition-all"
            >
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Get Secure OTP'}
            </Button>
          </form>
        ) : (
          <form onSubmit={verifyOTP} className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
            <div className="space-y-3 text-center">
              <Label htmlFor="otp" className="text-[10px] font-bold uppercase tracking-widest text-charcoal/60">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                className="h-16 bg-sage/5 border-sage/20 focus-visible:ring-teal text-center tracking-[1em] text-2xl font-bold"
              />
              <p className="text-[10px] text-muted-foreground mt-2">
                Code sent to +91 {phone}
              </p>
            </div>
            <Button 
              type="submit" 
              disabled={loading || otp.length < 6} 
              className="w-full h-14 bg-teal text-cream rounded-none uppercase tracking-[0.2em] font-bold text-xs hover:bg-charcoal transition-all"
            >
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Verify & Login'}
            </Button>
            
            <div className="text-center pt-4">
              {countdown > 0 ? (
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Resend OTP in {countdown}s</p>
              ) : (
                <button 
                  type="button" 
                  onClick={sendOTP}
                  className="text-[10px] text-teal font-bold uppercase tracking-widest hover:underline"
                >
                  Resend OTP
                </button>
              )}
              <div className="mt-4">
                <button 
                  type="button" 
                  onClick={() => setStep('phone')}
                  className="text-[10px] text-charcoal/40 font-bold uppercase tracking-widest hover:text-charcoal"
                >
                  Change Number
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="mt-12">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-sage/20" />
            </div>
            <div className="relative flex justify-center text-[9px] uppercase tracking-[0.3em] font-bold">
              <span className="bg-white px-4 text-charcoal/30">Or Continue With</span>
            </div>
          </div>

          <Button 
            type="button" 
            variant="outline" 
            onClick={loginWithGoogle}
            className="w-full h-14 mt-8 border-sage/30 hover:bg-sage/5 rounded-none gap-3 text-xs font-bold tracking-widest uppercase"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google Login
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-24 max-w-md flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-teal" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
