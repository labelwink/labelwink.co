'use client';

import { useState, useEffect } from 'react';
import { Bell, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface StockAlert {
  id: string;
  product_id: string;
  variant_id: string;
  size: string;
  email: string;
  created_at: string;
  products: { name: string } | null;
  product_variants: { size: string } | null;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  async function fetchAlerts() {
    setLoading(true);
    try {
      const res = await fetch('/api/storefront/stock-alerts');
      const data = await res.json();
      if (Array.isArray(data)) setAlerts(data);
    } catch {
      toast.error('Failed to load alerts');
    }
    setLoading(false);
  }

  async function removeAlert(variantId: string) {
    setRemoving(variantId);
    try {
      const res = await fetch(`/api/storefront/stock-alerts?variant_id=${variantId}`, { method: 'DELETE' });
      if (res.ok) {
        setAlerts(alerts.filter(a => a.variant_id !== variantId));
        toast.success('Alert removed');
      }
    } catch {
      toast.error('Failed to remove');
    }
    setRemoving(null);
  }

  function timeAgo(dateStr: string) {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#c9a84c]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <h1 className="text-2xl font-heading font-bold text-charcoal border-b border-sage/20 pb-4">
        Notifications & Alerts
      </h1>

      {/* Back-in-Stock Alerts section */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Back-in-Stock Alerts ({alerts.length})
        </h2>

        {alerts.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-sage/30 rounded-xl p-12 text-center">
            <Bell className="w-12 h-12 mx-auto text-sage/30 mb-4" />
            <p className="font-bold text-charcoal mb-1">No active alerts</p>
            <p className="text-sm text-muted-foreground mb-6">
              Subscribe to out-of-stock sizes on product pages to get notified when they&apos;re back.
            </p>
            <Link
              href="/products"
              className="inline-block bg-[#c9a84c] text-[#ffffff] px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#b5953e] transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => {
              const productName = (alert.products as any)?.name || 'Unknown Product';
              const size = (alert.product_variants as any)?.size || alert.size;

              return (
                <div key={alert.id} className="bg-white border border-sage/20 rounded-xl p-4 flex items-center gap-4 hover:border-sage/30 transition-colors">
                  <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-charcoal text-sm truncate">{productName}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="bg-sage/10 px-2 py-0.5 rounded font-bold text-charcoal">Size: {size}</span>
                      <span>Created: {timeAgo(alert.created_at)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeAlert(alert.variant_id)}
                    disabled={removing === alert.variant_id}
                    className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    {removing === alert.variant_id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
