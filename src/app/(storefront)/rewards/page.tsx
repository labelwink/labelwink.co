import React from 'react';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Coins, 
  Gift, 
  ChevronRight, 
  Users, 
  Star, 
  Clock, 
  CheckCircle2,
  Trophy,
  Activity
} from 'lucide-react';

export const revalidate = 3600; // Refresh once an hour

export default async function RewardsPage() {
  const supabase = await createClient();
  
  // Fetch stats from our new API (internal fetch)
  let publicStats = { total_members: 1200, points_awarded: 450000 };
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/storefront/referrals/stats`, { next: { revalidate: 3600 } });
    const data = await res.json();
    if (data.success) publicStats = data.stats;
  } catch (e) {
    console.error("Failed to fetch public stats", e);
  }

  // Fetch shop settings
  const { data: settings } = await supabase
    .from('shop_settings')
    .select('*')
    .single();

  // Fetch user stats if logged in
  const { data: { user } } = await supabase.auth.getUser();
  let userStats = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('loyalty_points, lifetime_earned')
      .eq('id', user.id)
      .single();
    userStats = data;
  }

  // Derived values
  const pointsPerRupee = settings?.loyalty_points_per_rupee || 1;
  const redemptionRatio = settings?.points_to_rupee_ratio || 100;
  const referralEnabled = settings?.referral_enabled || false;
  const referralPoints = settings?.referral_referrer_points || 200;
  const referredPoints = settings?.referral_referred_points || 100;

  // Tier thresholds from shop_settings
  const TIERS = settings?.loyalty_tiers || [
    { name: 'Bronze',   min: 0,     max: 999,   icon: '🥉', color: '#cd7f32', perks: ["Earn points on every order", "Birthday bonus"] },
    { name: 'Silver',   min: 1000,  max: 4999,  icon: '🥈', color: '#9e9e9e', perks: ["Everything in Bronze", "Early access to sales", "Exclusive events"] },
    { name: 'Gold',     min: 5000,  max: 9999,  icon: '🥇', color: '#c9a84c', perks: ["Everything in Silver", "Priority support", "Exclusive offers", "Complimentary shipping benefits"] },
  ];
  const userLifetime = userStats?.lifetime_earned || 0;
  const currentTierIndex = TIERS.findIndex((t: any, i: number) => userLifetime >= t.min && (TIERS[i+1] ? userLifetime < TIERS[i+1].min : true));
  const nextTier = TIERS[currentTierIndex + 1];

  return (
    <div className="bg-[#faf7f2] min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-white text-white overflow-hidden py-24 md:py-32">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <path d="M0,200 C0,100 100,0 200,0 C300,0 400,100 400,200 C400,300 300,400 200,400 C100,400 0,300 0,200" fill="#c9a84c" />
          </svg>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#c9a84c]/20 text-[#c9a84c] text-xs font-bold uppercase tracking-[0.2em] mb-6">
              <Trophy className="w-4 h-4" /> The Wink Rewards Club
            </div>
            <h1 className="text-5xl md:text-7xl font-heading font-medium mb-6 leading-tight">
              Earn with Every <br /> <span className="text-[#c9a84c]">Purchase</span>
            </h1>
            <p className="text-xl text-white/70 mb-10 leading-relaxed max-w-xl italic">
              Shop your favorite labels, collect points, and unlock exclusive rewards. It's our way of saying thank you.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Link 
                href="/products" 
                className="bg-[#c9a84c] text-white px-8 py-4 rounded-full font-bold hover:bg-[#b8973d] transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                Start Earning <ChevronRight className="w-5 h-5" />
              </Link>
              
              {user ? (
                <div className="bg-white/5 backdrop-blur-md border border-[#e8e2d6] rounded-2xl p-6 flex flex-col justify-center">
                  <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">Your Balance</p>
                  <div className="flex items-center gap-2">
                    <Coins className="w-6 h-6 text-[#c9a84c]" />
                    <span className="text-3xl font-mono font-bold text-white">{userStats?.loyalty_points?.toLocaleString() || 0}</span>
                    <span className="text-white/40 text-sm ml-1">Points</span>
                  </div>
                  <Link href="/account/wink-points" className="text-[#c9a84c] text-xs font-semibold hover:underline mt-2 flex items-center gap-1">
                    Manage Rewards →
                  </Link>
                </div>
              ) : (
                <Link 
                  href="/account/login" 
                  className="px-8 py-4 rounded-full font-bold text-white border border-[#e8e2d6] hover:bg-white/10 transition-all"
                >
                  Join Now
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Stats */}
      <div className="container mx-auto px-4 -mt-12 relative z-20">
        <div className="bg-white rounded-3xl shadow-2xl border border-sage/10 p-8 grid grid-cols-2 md:grid-cols-3 gap-8 text-center">
          <div className="space-y-1">
            <p className="text-3xl md:text-4xl font-mono font-bold text-charcoal tracking-tighter">
              {publicStats.total_members.toLocaleString()}+
            </p>
            <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground">Active Members</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl md:text-4xl font-mono font-bold text-[#c9a84c] tracking-tighter">
              {(publicStats.points_awarded / 1000).toFixed(1)}k
            </p>
            <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground">Points Awarded</p>
          </div>
          <div className="hidden md:block space-y-1 border-l border-sage/10">
            <p className="text-3xl md:text-4xl font-mono font-bold text-teal tracking-tighter">
              100%
            </p>
            <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground">Free to Join</p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <section className="py-24 container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-heading text-charcoal mb-4">How it Works</h2>
          <div className="w-24 h-1 bg-[#c9a84c] mx-auto opacity-30" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <StepCard 
            icon={ShoppingBag}
            step="01"
            title="Shop & Earn"
            description={`Earn ${pointsPerRupee} point for every ₹1 spent on all eligible products.`}
          />
          <StepCard 
            icon={Clock}
            step="02"
            title="Collect Points"
            description="Points are added automatically to your account as soon as your order is confirmed."
          />
          <StepCard 
            icon={Gift}
            step="03"
            title="Redeem & Save"
            description={`Every ${redemptionRatio} points is worth ₹1 off your next order at checkout.`}
          />
        </div>
      </section>

      {/* Tiers Section */}
      <section className="py-24 bg-white border-y border-sage/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-heading text-charcoal mb-4">Membership Tiers</h2>
            <p className="text-muted-foreground italic">Unlock more perks as you shop more with us.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TIERS.map((t: any, i: number) => (
              <TierCard 
                key={t.name}
                tier={t}
                isCurrent={currentTierIndex === i}
                isLogged={!!user}
              />
            ))}
          </div>

          {user && nextTier && (
            <div className="mt-16 max-w-2xl mx-auto">
              <div className="bg-[#faf7f2] rounded-3xl p-8 border border-sage/20 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest text-charcoal mb-1">Your Progress</h4>
                      <p className="text-xs text-muted-foreground italic">
                        Earn {(nextTier.min - userLifetime).toLocaleString()} more points to reach <b>{nextTier.name}</b>
                      </p>
                    </div>
                    <span className="text-2xl font-mono font-bold text-[#c9a84c]">
                      {userLifetime.toLocaleString()} <span className="text-xs text-muted-foreground">pts</span>
                    </span>
                  </div>
                  <div className="w-full h-3 bg-sage/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#c9a84c] rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, (userLifetime / nextTier.min) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Referral Section */}
      {referralEnabled && (
        <section className="py-24 container mx-auto px-4">
          <div className="bg-white rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-12 shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#c9a84c]/10 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#c9a84c]/5 rounded-full blur-3xl -ml-32 -mb-32" />
            
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 text-[#c9a84c] font-bold uppercase tracking-widest text-xs">
                <Users className="w-4 h-4" /> Refer a Friend
              </div>
              <h2 className="text-4xl md:text-5xl font-heading font-medium leading-tight">
                Better Together. <br /> Earn More with <span className="text-[#c9a84c]">Referrals</span>.
              </h2>
              <div className="space-y-4">
                <p className="text-white/60 leading-relaxed italic">
                  Invite your friends to the club and both of you get rewarded!
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm">
                    <div className="w-6 h-6 rounded-full bg-[#c9a84c]/20 flex items-center justify-center text-[#c9a84c] font-bold text-[10px]">1</div>
                    <span>You get <b>{referralPoints} points</b> on their first order</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <div className="w-6 h-6 rounded-full bg-[#c9a84c]/20 flex items-center justify-center text-[#c9a84c] font-bold text-[10px]">2</div>
                    <span>They get <b>{referredPoints} bonus points</b> immediately upon joining</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4">
                <Link 
                  href={user ? "/account/referrals" : "/account/login"} 
                  className="inline-flex items-center gap-2 bg-white text-[#ffffff] px-8 py-4 rounded-full font-bold hover:bg-[#faf7f2] transition-all shadow-lg"
                >
                  Get Your Referral Link <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
            
            <div className="flex-shrink-0 w-64 h-64 md:w-80 md:h-80 bg-[#c9a84c]/20 rounded-full flex items-center justify-center border border-[#c9a84c]/30 animate-pulse-slow">
              <Users className="w-32 h-32 text-[#c9a84c]" />
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section className="py-24 container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-heading text-charcoal mb-4">Frequently Asked Questions</h2>
          <div className="w-24 h-1 bg-[#c9a84c] mx-auto opacity-30" />
        </div>

        <div className="space-y-4">
          <FaqItem 
            question="Do points expire?" 
            answer="Wink Points don't expire as long as your account is active (one purchase or earn every 12 months)." 
          />
          <FaqItem 
            question="When are points added to my account?" 
            answer="Points are credited to your account as soon as your order is marked as confirmed or delivered in our system." 
          />
          <FaqItem 
            question="Can I redeem points on every order?" 
            answer="Absolutely! You can use your points at checkout for any purchase, excluding shipping fees." 
          />
          <FaqItem 
            question="Is there a minimum points requirement for redemption?" 
            answer={`You can redeem points in increments of 100. You need at least ${redemptionRatio} points (worth ₹1) to see the redemption option at checkout.`} 
          />
        </div>
      </section>
    </div>
  );
}

function StepCard({ icon: Icon, step, title, description }: any) {
  return (
    <div className="bg-white p-10 rounded-3xl border border-sage/10 hover:shadow-xl transition-all group">
      <div className="flex justify-between items-start mb-8">
        <div className="w-16 h-16 rounded-2xl bg-[#faf7f2] flex items-center justify-center group-hover:bg-[#c9a84c]/10 transition-colors">
          <Icon className="w-8 h-8 text-[#c9a84c]" />
        </div>
        <span className="text-4xl font-heading font-bold text-[#c9a84c]/10">{step}</span>
      </div>
      <h3 className="text-xl font-bold text-charcoal mb-4 uppercase tracking-wider">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed italic">{description}</p>
    </div>
  );
}

function TierCard({ tier, isCurrent, isLogged }: any) {
  return (
    <div className={`
      relative bg-white rounded-3xl p-10 border transition-all h-full
      ${isCurrent ? 'border-[#c9a84c] shadow-2xl scale-105 z-10' : 'border-sage/10 hover:border-sage/30'}
    `}>
      {isCurrent && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#c9a84c] text-white text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full whitespace-nowrap shadow-md">
          Your Current Tier
        </div>
      )}
      <div className="text-4xl mb-6">{tier.icon}</div>
      <h3 className="text-2xl font-heading font-medium text-charcoal mb-2">{tier.name}</h3>
      <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-8">
        {tier.max === Infinity ? `${tier.min.toLocaleString()}+ Points` : `${tier.min.toLocaleString()} - ${tier.max.toLocaleString()} Points`}
      </p>
      
      <div className="space-y-4">
        {tier.perks.map((perk: string) => (
          <div key={perk} className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-[#c9a84c] flex-shrink-0 mt-0.5" />
            <span className="text-sm text-charcoal/70 leading-tight italic">{perk}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string, answer: string }) {
  return (
    <details className="group bg-white border border-sage/10 rounded-2xl overflow-hidden shadow-sm">
      <summary className="flex items-center justify-between p-6 cursor-pointer list-none hover:bg-[#faf7f2] transition-colors">
        <span className="font-bold text-charcoal uppercase tracking-wider text-sm">{question}</span>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-open:rotate-90 transition-transform" />
      </summary>
      <div className="p-6 pt-0 text-muted-foreground text-sm leading-relaxed border-t border-sage/5 italic">
        {answer}
      </div>
    </details>
  );
}
