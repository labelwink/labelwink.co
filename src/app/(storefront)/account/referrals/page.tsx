'use client';

import { useState, useEffect } from 'react';
import { 
  Gift, 
  Copy, 
  Share2, 
  Users, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  Loader2,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ReferralDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetchData();
    fetchSettings();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/storefront/referrals');
      const json = await res.json();
      setData(json);
    } catch (err) {
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/storefront/settings');
      const json = await res.json();
      setSettings(json);
    } catch (err) {
      console.error('Failed to load settings');
    }
  };

  const copyLink = () => {
    if (!data?.referral_link) return;
    navigator.clipboard.writeText(data.referral_link);
    toast.success('Referral link copied to clipboard!');
  };

  const shareWhatsApp = () => {
    if (!data?.referral_link) return;
    const text = encodeURIComponent(`Join LabelWink and get ${settings?.referral_referred_points || 100} bonus points! ${data.referral_link}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#c9a84c] animate-spin" />
      </div>
    );
  }

  const referredPoints = settings?.referral_referred_points || 100;
  const referrerPoints = settings?.referral_referrer_points || 200;
  const minOrder = settings?.referral_qualifying_min_order || 999;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-heading text-charcoal mb-2">Refer & Earn</h1>
        <p className="text-muted-foreground italic">Share the love for LabelWink and earn rewards together.</p>
      </div>

      {/* Referral Link Card */}
      <div className="bg-charcoal text-[#faf7f2] rounded-3xl p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Gift className="w-32 h-32" />
        </div>

        <div className="relative z-10 max-w-lg">
          <h2 className="text-xl font-heading text-[#c9a84c] mb-4">Your Unique Invite Link</h2>
          <p className="text-sm text-[#faf7f2]/70 mb-6">
            Share this link with your friends. When they sign up, they get bonus points, and you get rewarded after their first order!
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 bg-white/5 border border-[#e8e2d6] rounded-xl px-4 py-3 flex items-center gap-2 overflow-hidden">
              <span className="text-xs font-mono text-[#faf7f2]/50 truncate flex-1">
                {data?.referral_link}
              </span>
              <button 
                onClick={copyLink}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-[#c9a84c]"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <button 
              onClick={shareWhatsApp}
              className="bg-[#25D366] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform"
            >
              <Share2 className="w-4 h-4" /> WhatsApp
            </button>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="bg-[#c9a84c]/20 border border-[#c9a84c]/30 rounded-2xl px-4 py-2">
              <span className="text-xs uppercase tracking-widest font-bold text-[#c9a84c]">Total Earned</span>
              <div className="text-2xl font-heading text-[#faf7f2]">{data?.points_earned || 0} Points</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-sage/20 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground mb-4">
            <Users className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Total Referred</span>
          </div>
          <div className="text-3xl font-heading text-charcoal">{data?.total_referrals || 0}</div>
        </div>

        <div className="bg-white border border-sage/20 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-teal mb-4">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Successful</span>
          </div>
          <div className="text-3xl font-heading text-charcoal">{data?.successful_referrals || 0}</div>
        </div>

        <div className="bg-white border border-sage/20 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-orange-500 mb-4">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Pending</span>
          </div>
          <div className="text-3xl font-heading text-charcoal">{data?.pending_referrals || 0}</div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white border border-sage/20 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-sage/10 bg-sage/5">
          <h3 className="font-heading text-xl text-charcoal">Recent Referrals</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-sage/5 text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground border-b border-sage/10">
              <tr>
                <th className="px-8 py-4">Name</th>
                <th className="px-8 py-4">Joined</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-right">Reward</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage/10">
              {data?.referred_users?.length > 0 ? (
                data.referred_users.map((ref: any, i: number) => (
                  <tr key={i} className="hover:bg-sage/5 transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-medium text-charcoal">{ref.first_name}</div>
                    </td>
                    <td className="px-8 py-5 text-sm text-muted-foreground">
                      {format(new Date(ref.joined_at), 'dd MMM yyyy')}
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        ref.status === 'completed' 
                          ? 'bg-teal/10 text-teal' 
                          : 'bg-orange-500/10 text-orange-500'
                      }`}>
                        {ref.status === 'completed' ? (
                          <><CheckCircle className="w-3 h-3" /> Completed</>
                        ) : (
                          <><Clock className="w-3 h-3" /> Pending</>
                        )}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right font-bold text-charcoal">
                      {ref.status === 'completed' ? `+${referrerPoints}` : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-muted-foreground italic">
                    No referrals yet. Start sharing to earn rewards!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-sage/5 border border-sage/10 rounded-3xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Info className="w-5 h-5 text-[#c9a84c]" />
          <h3 className="font-heading text-xl text-charcoal">How it works</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <div className="text-[#c9a84c] font-heading text-2xl">01</div>
            <h4 className="font-bold text-charcoal">Share your link</h4>
            <p className="text-sm text-muted-foreground">Send your unique invite link to your friends via WhatsApp or Social Media.</p>
          </div>
          <div className="space-y-2">
            <div className="text-[#c9a84c] font-heading text-2xl">02</div>
            <h4 className="font-bold text-charcoal">Friend joins</h4>
            <p className="text-sm text-muted-foreground">Your friend signs up and instantly receives {referredPoints} bonus Wink Points.</p>
          </div>
          <div className="space-y-2">
            <div className="text-[#c9a84c] font-heading text-2xl">03</div>
            <h4 className="font-bold text-charcoal">Get rewarded</h4>
            <p className="text-sm text-muted-foreground">When your friend places their first order (min ₹{minOrder}), you earn {referrerPoints} points!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
