'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthModal } from '@/components/auth/OTPLoginModal';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Sparkles, Gift, ArrowRight } from 'lucide-react';

function JoinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openModal } = useAuthModal();
  const [referrer, setReferrer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      localStorage.setItem('ref_code', refCode);
      lookupReferrer(refCode);
    } else {
      setLoading(false);
    }

    checkUser();
    fetchSettings();
  }, [searchParams]);

  const checkUser = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setIsLoggedIn(true);
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/storefront/settings');
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      console.error('Failed to fetch settings');
    }
  };

  const lookupReferrer = async (code: string) => {
    try {
      const res = await fetch(`/api/storefront/referrals/lookup?ref=${code}`);
      const data = await res.json();
      if (data.found) {
        setReferrer(data.first_name);
      }
    } catch (err) {
      console.error('Referrer lookup failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#c9a84c] animate-spin" />
      </div>
    );
  }

  const referredPoints = settings?.referral_referred_points || 100;
  const ratio = settings?.points_to_rupee_ratio || 1;
  const discountValue = Math.floor(referredPoints * ratio);

  return (
    <div className="min-h-screen bg-white text-[#faf7f2] flex flex-col items-center justify-center px-4 py-20 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#c9a84c]/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#c9a84c]/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-xl w-full text-center space-y-12 relative z-10">
        {/* Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-[#c9a84c]/10 rounded-full mb-4 border border-[#c9a84c]/20">
            <Sparkles className="w-8 h-8 text-[#c9a84c]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-heading tracking-tight leading-tight">
            {referrer ? (
              <span className="block text-[#c9a84c] mb-2">{referrer} thinks you'll love LabelWink!</span>
            ) : (
              <span className="block text-[#c9a84c] mb-2">Welcome to LabelWink!</span>
            )}
            Join the Wink Club
          </h1>
          <p className="text-lg text-[#faf7f2]/60 italic max-w-md mx-auto">
            Experience grace in every thread. Start your journey with an exclusive welcome gift.
          </p>
        </div>

        {/* Benefits Card */}
        <div className="bg-white/5 border border-[#c9a84c]/20 rounded-3xl p-8 space-y-8 backdrop-blur-xl">
          <div className="grid grid-cols-1 gap-6">
            <div className="flex items-start gap-4 text-left p-4 rounded-2xl bg-[#c9a84c]/5 border border-[#c9a84c]/10 group hover:border-[#c9a84c]/30 transition-colors">
              <div className="bg-[#c9a84c] p-2 rounded-lg">
                <Gift className="w-5 h-5 text-[#ffffff]" />
              </div>
              <div>
                <h3 className="font-bold text-[#faf7f2]">Instant Welcome Bonus</h3>
                <p className="text-sm text-[#faf7f2]/60">Get {referredPoints} Wink Points immediately upon signup.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 text-left p-4 rounded-2xl bg-[#c9a84c]/5 border border-[#c9a84c]/10 group hover:border-[#c9a84c]/30 transition-colors">
              <div className="bg-[#c9a84c] p-2 rounded-lg">
                <Sparkles className="w-5 h-5 text-[#ffffff]" />
              </div>
              <div>
                <h3 className="font-bold text-[#faf7f2]">Pure Savings</h3>
                <p className="text-sm text-[#faf7f2]/60">Points worth ₹{discountValue} off your first order.</p>
              </div>
            </div>
          </div>

          {isLoggedIn ? (
            <div className="space-y-4 pt-4">
              <p className="text-[#c9a84c] font-medium">You're already a member!</p>
              <button
                onClick={() => router.push('/shop')}
                className="w-full bg-[#c9a84c] text-[#ffffff] font-bold py-5 rounded-xl hover:bg-[#b8973d] transition-all flex items-center justify-center gap-2 group"
              >
                Go to Shop <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ) : (
            <div className="space-y-6 pt-4">
              <button
                onClick={() => openModal()}
                className="w-full bg-[#c9a84c] text-[#ffffff] font-bold py-5 rounded-xl hover:bg-[#b8973d] transition-all flex items-center justify-center gap-2 group text-lg"
              >
                Create My Account <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="text-[#faf7f2]/40">Already have an account?</span>
                <button 
                  onClick={() => openModal()}
                  className="text-[#c9a84c] font-bold hover:underline"
                >
                  Sign in &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-[10px] uppercase tracking-[0.4em] text-[#faf7f2]/30 font-bold">
          Grace in Every Thread &bull; LabelWink
        </p>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <JoinContent />
    </Suspense>
  );
}
