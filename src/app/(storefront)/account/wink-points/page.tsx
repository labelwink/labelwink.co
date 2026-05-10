'use client';

import { useState, useEffect } from 'react';
import { Coins, TrendingUp, TrendingDown, RotateCcw, ArrowUpCircle, Clock, Gift, Copy, CheckCheck } from 'lucide-react';
import Link from 'next/link';

interface PointsRecord {
  id: string;
  type: 'earned' | 'spent' | 'refunded' | 'adjusted' | 'expired';
  points: number;
  balance_after: number;
  description: string;
  created_at: string;
  order_id: string | null;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  earned:   { icon: TrendingUp,   color: 'text-green-600',  label: 'Earned'   },
  spent:    { icon: TrendingDown, color: 'text-red-500',    label: 'Spent'    },
  refunded: { icon: RotateCcw,    color: 'text-blue-500',   label: 'Refunded' },
  adjusted: { icon: ArrowUpCircle,color: 'text-purple-500', label: 'Adjusted' },
  expired:  { icon: Clock,        color: 'text-[#5a7060]',   label: 'Expired'  },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function WinkPointsPage() {
  const [balance, setBalance]         = useState(0);
  const [lifetimeEarned, setLifetime] = useState(0);
  const [tier, setTier]               = useState('Bronze');
  const [history, setHistory]         = useState<PointsRecord[]>([]);
  const [loading, setLoading]         = useState(true);

  // Redeem state
  const [copied,       setCopied]           = useState(false);
  const [tiers,        setTiers]            = useState<any[]>([]);
  const [redeemRatio,  setRedeemRatio]      = useState(100);
  const [pointsRate,   setPointsRate]       = useState(1);

  useEffect(() => {
    Promise.all([
      fetch('/api/storefront/loyalty').then(r => r.json()),
      fetch('/api/storefront/loyalty/history').then(r => r.json()),
    ]).then(([bal, hist]) => {
      setBalance(bal.points ?? 0);
      setLifetime(bal.lifetime_earned ?? 0);
      setTier(bal.loyalty_tier ?? 'Bronze');
      setHistory(hist.history ?? []);
      setRedeemPoints(Math.min(100, bal.points ?? 0));
      setTiers(bal.tiers || []);
      setRedeemRatio(bal.redeem_ratio || 100);
      setPointsRate(bal.points_per_rupee || 1);
    }).finally(() => setLoading(false));
  }, []);

  // Tier thresholds from API
  const TIERS = tiers.length > 0 ? tiers.map(t => ({ ...t, bg: t.bg || '#f5f5f5' })) : [
    { name: 'Bronze',   min: 0,     max: 999,   color: '#cd7f32', bg: '#fdf3e7' },
    { name: 'Silver',   min: 1000,  max: 4999,  color: '#9e9e9e', bg: '#f5f5f5' },
    { name: 'Gold',     min: 5000,  max: 9999,  color: '#c9a84c', bg: '#fffbeb' },
    { name: 'Platinum', min: 10000, max: Infinity, color: '#016a6e', bg: '#f0fafa' },
  ];
  const currentTier = TIERS.find(t => t.name === tier) ?? TIERS[0];
  const nextTier    = TIERS[TIERS.indexOf(currentTier) + 1];
  const progressPct = nextTier
    ? Math.min(100, ((lifetimeEarned - currentTier.min) / (nextTier.min - currentTier.min)) * 100)
    : 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 rounded-full border-2 border-[#016a6e] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Balance card */}
      <div
        className="rounded-2xl p-8 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a3a34 0%, #016a6e 100%)' }}
      >
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-12 -left-8 w-52 h-52 rounded-full bg-white/5" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Coins className="w-4 h-4 text-amber-300" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">Wink Points Balance</p>
          </div>
          <p className="text-5xl font-bold font-mono tracking-tight">{balance.toLocaleString('en-IN')}</p>
          <p className="text-sm text-white/60 mt-1">≈ ₹{(balance / (redeemRatio / 100)).toLocaleString('en-IN')} off your next order</p>

          {/* Tier badge */}
          <div className="mt-6 flex items-center gap-3">
            <span
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: currentTier.bg, color: currentTier.color }}
            >
              {currentTier.name} Member
            </span>
            {nextTier && (
              <span className="text-[11px] text-white/50">
                {(nextTier.min - lifetimeEarned).toLocaleString('en-IN')} pts more to reach {nextTier.name}
              </span>
            )}
          </div>

          {/* Progress bar */}
          {nextTier && (
            <div className="mt-3 bg-white/20 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{ width: `${progressPct}%`, backgroundColor: currentTier.color }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Redeem Points */}
      {balance >= 100 && (
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm text-[#1a3a34]">Convert Points to Discount Code</h3>
          </div>

          {redeemResult ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center space-y-3">
              <CheckCheck className="w-8 h-8 text-green-600 mx-auto" />
              <p className="text-sm font-semibold text-green-800">₹{redeemResult.discount} discount code generated!</p>
              <div className="flex items-center gap-2 bg-white border border-green-200 rounded-lg px-4 py-3">
                <code className="flex-1 font-mono font-bold text-lg text-[#1a3a34] tracking-widest">{redeemResult.code}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(redeemResult.code);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1 text-xs text-[#1a3a34] font-semibold hover:text-[#016a6e] transition-colors"
                >
                  {copied ? <><CheckCheck className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
              <p className="text-xs text-[#9aab9e]">Valid for 30 days. Use at checkout.</p>
              <button
                onClick={() => setRedeemResult(null)}
                className="text-xs text-[#016a6e] hover:underline"
              >
                Redeem more points
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-[#9aab9e] mb-2">
                  <span>Points to redeem</span>
                  <span className="font-bold text-[#1a3a34]">{redeemPoints.toLocaleString('en-IN')} pts = ₹{(redeemPoints / (redeemRatio / 100)).toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={balance}
                  step={100}
                  value={redeemPoints}
                  onChange={e => setRedeemPoints(Number(e.target.value))}
                  className="w-full accent-teal h-1.5"
                />
                <div className="flex justify-between text-[10px] text-[#5a7060] mt-1">
                  <span>100 pts min</span>
                  <span>{balance.toLocaleString('en-IN')} pts max</span>
                </div>
              </div>
              <button
                onClick={async () => {
                  setRedeeming(true);
                  try {
                    const res = await fetch('/api/storefront/loyalty/redeem', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ points: redeemPoints }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setRedeemResult({ code: data.code, discount: data.discount_rupees });
                      setBalance(data.new_balance);
                    } else {
                      alert(data.error || 'Redemption failed');
                    }
                  } finally {
                    setRedeeming(false);
                  }
                }}
                disabled={redeeming || redeemPoints < 100}
                className="w-full h-12 bg-[#1a3a34] text-white rounded-xl text-sm font-bold hover:bg-[#16312b] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {redeeming ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Generating…</>
                ) : (
                  <><Gift className="w-4 h-4" /> Get ₹{redeemPoints} Discount Code</>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* How to earn */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
        <h3 className="font-bold text-sm text-[#1a3a34] mb-3">How to earn Wink Points</h3>
        <ul className="space-y-2 text-xs text-gray-600">
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center font-bold text-[10px]">{(pointsRate * 100).toFixed(0)}</span>
            points per ₹100 spent (awarded on delivery)
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px]">₹</span>
            {redeemRatio} points = ₹1 off at checkout
          </li>
          <li className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-[10px]">↩</span>
            Approved returns credited back as store credit
          </li>
        </ul>
      </div>

      {/* Transaction history */}
      <div>
        <h3 className="font-bold text-sm text-[#1a3a34] mb-4 uppercase tracking-wider">Transaction History</h3>
        {history.length === 0 ? (
          <div className="text-center py-12 text-[#5a7060] text-sm">
            <Coins className="w-10 h-10 text-[#1a2e1e] mx-auto mb-3" />
            <p>No transactions yet.</p>
            <Link href="/products" className="text-[#016a6e] font-semibold hover:underline text-xs mt-1 block">
              Start shopping to earn points →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map(tx => {
              const cfg = TYPE_CONFIG[tx.type] ?? TYPE_CONFIG.adjusted;
              const Icon = cfg.icon;
              const isCredit = tx.points > 0;
              const orderHref = tx.order_id ? `/account/orders/${tx.order_id}` : null;
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 bg-white border border-gray-100 rounded-xl px-4 py-3.5 hover:border-gray-200 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCredit ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#1a3a34] truncate">{tx.description}</p>
                    <p className="text-[10px] text-[#5a7060] mt-0.5">{timeAgo(tx.created_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                      {isCredit ? '+' : ''}{tx.points.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] text-[#5a7060]">Bal: {tx.balance_after.toLocaleString('en-IN')}</p>
                  </div>
                  {orderHref && (
                    <Link href={orderHref} className="text-[10px] text-[#016a6e] hover:underline flex-shrink-0 ml-1">
                      View →
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
