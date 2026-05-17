'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, RotateCcw, Package, ChevronRight, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const RETURN_REASONS = [
  'Wrong size / fit issue',
  'Product defect or damage',
  'Wrong item delivered',
  'Not as described',
  'Changed my mind',
  'Other',
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType; desc: string }> = {
  pending:   { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700', icon: Clock,         desc: 'Our team will review your request within 24–48 hours.' },
  approved:  { label: 'Approved',       color: 'bg-green-100 text-green-700',   icon: CheckCircle2,  desc: 'Your return has been approved. Please follow the instructions sent to your email.' },
  rejected:  { label: 'Rejected',       color: 'bg-red-100 text-red-700',       icon: AlertCircle,   desc: 'Unfortunately your return was not approved. Contact support for help.' },
  refunded:  { label: 'Refunded',       color: 'bg-teal/10 text-teal-700',      icon: CheckCircle2,  desc: 'Your refund has been processed. It may take 5–7 business days to reflect.' },
};

interface ReturnRequest {
  id: string;
  reason: string;
  status: keyof typeof STATUS_CONFIG;
  admin_note: string | null;
  refund_amount: number | null;
  created_at: string;
  orders: { id: string; order_number?: string | null; total: number; created_at: string } | null;
}

interface DeliveredOrder {
  id: string;
  order_number?: string | null;
  total: number;
  created_at: string;
}

export default function AccountReturnsPage() {
  const supabase = createClient();

  const [returns,         setReturns]         = useState<ReturnRequest[]>([]);
  const [deliveredOrders, setDeliveredOrders]  = useState<DeliveredOrder[]>([]);
  const [loading,         setLoading]          = useState(true);
  const [showForm,        setShowForm]         = useState(false);
  const [submitting,      setSubmitting]       = useState(false);
  const [submitResult,    setSubmitResult]     = useState<{ success?: boolean; error?: string } | null>(null);

  const [form, setForm] = useState({
    order_id:    '',
    reason:      '',
    description: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [returnsRes, ordersRes] = await Promise.all([
      fetch('/api/storefront/returns').then(r => r.json()),
      supabase
        .from('orders')
        .select('id, order_number, total, created_at')
        .eq('user_id', user.id)
        .eq('status', 'delivered')
        .order('created_at', { ascending: false }),
    ]);

    if (Array.isArray(returnsRes)) setReturns(returnsRes);

    // Filter out orders that already have a return request
    const returnedOrderIds = new Set(
      (Array.isArray(returnsRes) ? returnsRes : []).map((r: ReturnRequest) => r.orders?.id)
    );
    const eligible = (ordersRes.data || []).filter(o => !returnedOrderIds.has(o.id));
    setDeliveredOrders(eligible);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.order_id || !form.reason) return;
    setSubmitting(true);
    setSubmitResult(null);

    const res = await fetch('/api/storefront/returns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (res.ok) {
      setSubmitResult({ success: true });
      setShowForm(false);
      setForm({ order_id: '', reason: '', description: '' });
      fetchData(); // refresh
    } else {
      setSubmitResult({ error: data.error || 'Failed to submit. Please try again.' });
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="border-b border-sage/20 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-charcoal">Returns &amp; Refunds</h1>
          <p className="text-muted-foreground text-sm mt-1">Request returns for delivered orders within 7 days.</p>
        </div>
        {deliveredOrders.length > 0 && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#1a3a34] text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#16312b] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Request Return
          </button>
        )}
      </div>

      {/* Success banner */}
      {submitResult?.success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 text-sm text-green-700 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          Your return request has been submitted. Our team will respond within 24–48 hours.
        </div>
      )}

      {/* Return Request Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-sage/20 rounded-2xl p-6 space-y-5 animate-in slide-in-from-top-3 duration-300"
        >
          <h2 className="font-semibold text-charcoal flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-teal" /> New Return Request
          </h2>

          {/* Order selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-charcoal/60 mb-2">
              Select Order *
            </label>
            <select
              value={form.order_id}
              onChange={e => setForm(f => ({ ...f, order_id: e.target.value }))}
              required
              className="w-full border border-sage/20 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal"
            >
              <option value="">— Choose a delivered order —</option>
              {deliveredOrders.map(o => (
                 <option key={o.id} value={o.id}>
                   Order #{o.order_number || o.id.slice(0, 8).toUpperCase()} · ₹{Number(o.total).toLocaleString('en-IN')} · {new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                 </option>
              ))}
            </select>
            {deliveredOrders.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">No eligible orders. Only delivered orders can be returned.</p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-charcoal/60 mb-2">
              Return Reason *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {RETURN_REASONS.map(r => (
                <label
                  key={r}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors text-sm ${
                    form.reason === r
                      ? 'border-[#016a6e] bg-[#016a6e]/5 text-charcoal font-medium'
                      : 'border-sage/20 text-charcoal/70 hover:border-sage/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={form.reason === r}
                    onChange={() => setForm(f => ({ ...f, reason: r }))}
                    className="sr-only"
                  />
                  <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    form.reason === r ? 'border-[#016a6e]' : 'border-sage/30'
                  }`}>
                    {form.reason === r && <span className="w-2 h-2 rounded-full bg-[#016a6e]" />}
                  </span>
                  {r}
                </label>
              ))}
            </div>
          </div>

          {/* Additional notes */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-charcoal/60 mb-2">
              Additional Details (optional)
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Describe the issue in more detail, include photos if needed…"
              className="w-full border border-sage/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none"
            />
          </div>

          {submitResult?.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">
              {submitResult.error}
            </p>
          )}

          {/* Policy note */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-800">
            <strong>Return Policy:</strong> Items must be unused, unwashed, and in original packaging. Returns accepted within 7 days of delivery. Refunds are processed within 5–7 business days after approval.
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setShowForm(false); setSubmitResult(null); }}
              className="flex-1 h-12 border border-sage/20 rounded-xl text-sm font-medium text-charcoal/70 hover:bg-sage/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !form.order_id || !form.reason}
              className="flex-1 h-12 bg-[#1a3a34] text-white rounded-xl text-sm font-semibold hover:bg-[#16312b] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RotateCcw className="w-4 h-4" /> Submit Request</>}
            </button>
          </div>
        </form>
      )}

      {/* Returns list */}
      {returns.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-charcoal">Your Return Requests</h2>
          {returns.map(ret => {
            const cfg = STATUS_CONFIG[ret.status] || STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            return (
              <div key={ret.id} className="bg-white border border-sage/20 rounded-2xl overflow-hidden">
                {/* Header strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-sage/5 px-5 py-3 border-b border-sage/10">
                  <div className="flex flex-wrap gap-x-6 gap-y-1">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Return ID</p>
                      <p className="text-xs font-mono font-bold text-charcoal">#{ret.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    {ret.orders && (
                      <div>
                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Order</p>
                        <Link
                          href={`/account/orders/${ret.orders.id}`}
                          className="text-xs font-bold text-teal hover:underline"
                        >
                          #{ret.orders?.order_number || ret.orders?.id?.slice(0, 8).toUpperCase()}
                        </Link>
                      </div>
                    )}
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Submitted</p>
                      <p className="text-xs font-semibold text-charcoal">
                        {new Date(ret.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>
                    <StatusIcon className="w-3 h-3" /> {cfg.label}
                  </span>
                </div>

                {/* Content */}
                <div className="px-5 py-4 space-y-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Reason</p>
                    <p className="text-sm font-medium text-charcoal">{ret.reason}</p>
                  </div>
                  <p className="text-xs text-charcoal/60 bg-sage/5 rounded-lg px-4 py-2">{cfg.desc}</p>

                  {ret.admin_note && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-1">Team Note</p>
                      <p className="text-sm text-blue-800">{ret.admin_note}</p>
                    </div>
                  )}
                  {ret.refund_amount && (
                    <div className="flex items-center gap-2 text-sm font-semibold text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Refund Amount: ₹{Number(ret.refund_amount).toLocaleString('en-IN')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : !showForm && (
        <div className="bg-white border-2 border-dashed border-sage/30 rounded-2xl p-16 text-center">
          <RotateCcw className="w-10 h-10 mx-auto text-sage/30 mb-4" />
          <h3 className="font-semibold text-charcoal mb-2">No Return Requests</h3>
          <p className="text-sm text-muted-foreground mb-6">
            {deliveredOrders.length > 0
              ? 'You can request a return for any delivered order within 7 days.'
              : 'Once your orders are delivered, you can request returns here.'}
          </p>
          {deliveredOrders.length > 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-[#1a3a34] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#16312b] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Request a Return
            </button>
          )}
          {deliveredOrders.length === 0 && (
            <Link
              href="/account/orders"
              className="inline-flex items-center gap-2 text-xs font-bold text-teal uppercase tracking-wider hover:underline"
            >
              <Package className="w-3.5 h-3.5" /> View My Orders <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
