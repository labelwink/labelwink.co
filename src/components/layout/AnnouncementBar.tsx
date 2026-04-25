'use client';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Announcement {
  id: string;
  text: string;
  link?: string;
}

interface AnnouncementBarProps {
  items: Announcement[];
  speed?: number;
}

import { createClient } from '@/lib/supabase/client';

export function AnnouncementBar({ items: initialItems, speed = 3000 }: AnnouncementBarProps) {
  const [items, setItems] = useState<Announcement[]>(initialItems || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    if (initialItems) {
      setItems(initialItems);
      return;
    }

    async function fetchAnnouncements() {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (data) setItems(data as Announcement[]);
    }
    fetchAnnouncements();
  }, [initialItems]);

  useEffect(() => {
    if (!items || items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, speed);
    return () => clearInterval(interval);
  }, [items?.length, speed]);

  if (!items || items.length === 0) return null;

  return (
    <div className="bg-charcoal text-cream py-2 px-4 relative overflow-hidden">
      <div className="container mx-auto flex items-center justify-center text-[10px] md:text-xs font-medium tracking-[0.2em] uppercase">
        <div className="transition-all duration-500 ease-in-out text-center">
          {items[currentIndex].link ? (
            <a href={items[currentIndex].link} className="hover:underline">
              {items[currentIndex].text}
            </a>
          ) : (
            <span>{items[currentIndex].text}</span>
          )}
        </div>
      </div>
      
      {items.length > 1 && (
        <>
          <button 
            onClick={() => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1 hover:text-white/70 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <button 
            onClick={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:text-white/70 transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </>
      )}
    </div>
  );
}
