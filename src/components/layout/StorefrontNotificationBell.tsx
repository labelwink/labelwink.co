'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Package, RotateCcw, Star, X, CheckCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import Link from 'next/link';

interface OrderNotification {
  id: string;
  type: 'order_confirmed' | 'order_shipped' | 'order_delivered' | 'return_approved' | 'return_rejected' | 'review_approved';
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  data: Record<string, string> | null;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const ICON_MAP: Record<string, React.ElementType> = {
  order_confirmed: Package,
  order_shipped:   Package,
  order_delivered: Package,
  return_approved: RotateCcw,
  return_rejected: RotateCcw,
  review_approved: Star,
};

const COLOR_MAP: Record<string, string> = {
  order_confirmed:  'bg-blue-100 text-blue-600',
  order_shipped:    'bg-purple-100 text-purple-600',
  order_delivered:  'bg-green-100 text-green-600',
  return_approved:  'bg-emerald-100 text-emerald-600',
  return_rejected:  'bg-red-100 text-red-600',
  review_approved:  'bg-amber-100 text-amber-600',
};

export function StorefrontNotificationBell() {
  const supabase = createClient();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [open, setOpen] = useState(false);
  // Keep a stable ref so cleanup always has access to the latest channel
  const channelRef = useRef<RealtimeChannel | null>(null);

  const unread = notifications.filter(n => !n.is_read).length;

  const fetchNotifications = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('customer_notifications')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setNotifications(data as OrderNotification[]);
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;

      setUser(user);
      fetchNotifications(user.id);

      // IMPORTANT: chain .on() BEFORE .subscribe()
      const channel = supabase
        .channel(`customer_notifications_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'customer_notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setNotifications(prev => [payload.new as OrderNotification, ...prev]);
          }
        )
        .subscribe();

      channelRef.current = channel;
    }

    init();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markRead = async (id?: string) => {
    if (!user) return;
    if (id) {
      await supabase.from('customer_notifications').update({ is_read: true }).eq('id', id).eq('user_id', user.id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } else {
      await supabase.from('customer_notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const getLink = (n: OrderNotification) => {
    if (n.data?.order_id) return `/account/orders/${n.data.order_id}`;
    if (n.data?.return_id) return `/account/returns`;
    return '/account/orders';
  };

  // Don't render if not logged in
  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifications(user.id); }}
        className="relative text-[#faf7f2]/70 hover:text-[#faf7f2] transition-colors p-1.5 rounded-lg hover:bg-white/10"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-[320px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-[#1a3a34]/5">
              <span className="font-semibold text-sm text-[#1a3a34]">Notifications</span>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button
                    onClick={() => markRead()}
                    className="text-[10px] text-[#016a6e] hover:underline font-semibold flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 p-0.5 rounded">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-50">
              {notifications.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center gap-2">
                  <Bell className="w-8 h-8 text-gray-200" />
                  <p className="text-sm text-gray-400">No notifications yet</p>
                  <p className="text-xs text-gray-300">Order updates will appear here</p>
                </div>
              ) : notifications.map(n => {
                const Icon = ICON_MAP[n.type] ?? Bell;
                const colorClass = COLOR_MAP[n.type] ?? 'bg-gray-100 text-gray-500';
                return (
                  <Link
                    key={n.id}
                    href={getLink(n)}
                    onClick={() => { markRead(n.id); setOpen(false); }}
                    className={`flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-blue-50/40' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${colorClass}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#1a3a34] truncate">{n.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-[#016a6e] flex-shrink-0 mt-2" />}
                  </Link>
                );
              })}
            </div>

            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <Link
                href="/account/orders"
                onClick={() => setOpen(false)}
                className="text-[11px] text-[#016a6e] font-semibold hover:underline block text-center"
              >
                View all orders →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
