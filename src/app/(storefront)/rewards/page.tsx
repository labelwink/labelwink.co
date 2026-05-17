import React from 'react';
import { Trophy, Instagram, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function RewardsPage() {
  return (
    <div className="bg-[#FAF8F5] min-h-[85vh] flex items-center justify-center py-20 px-4">
      <div className="max-w-xl w-full text-center space-y-8 p-10 md:p-14 bg-white rounded-[2.5rem] border border-[#E8DFC8] shadow-xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#c9a84c]/5 rounded-full blur-2xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#1C3829]/5 rounded-full blur-2xl -ml-16 -mb-16" />

        <div className="relative z-10 space-y-6">
          {/* Trophy Badge with custom styling */}
          <div className="mx-auto w-20 h-20 bg-[#FAF5E9] border border-[#E8DFC8] text-[#c9a84c] rounded-full flex items-center justify-center shadow-inner">
            <Trophy className="w-10 h-10" />
          </div>

          <div className="space-y-3">
            <span className="text-[10px] tracking-[0.3em] font-extrabold text-[#c9a84c] uppercase block">
              The Wink Rewards Club
            </span>
            <h1 className="text-4xl md:text-5xl font-heading font-semibold text-[#1C3829] leading-tight">
              Coming Soon
            </h1>
            <div className="w-16 h-[2px] bg-[#c9a84c] mx-auto my-4" />
            <p className="text-sm md:text-base text-[#6B6B5A] italic max-w-sm mx-auto leading-relaxed">
              We are crafting an exclusive loyalty and rewards experience for our community. Stay tuned for exciting rewards, premium member perks, and point redemption systems!
            </p>
          </div>

          {/* Dynamic CTAs */}
          <div className="flex flex-col gap-3 pt-6 max-w-xs mx-auto">
            {/* Instagram Call to Action */}
            <a 
              href="https://www.instagram.com/labelwink/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full h-12 bg-[#1C3829] text-white rounded-full text-xs font-bold hover:bg-[#16312b] transition-all flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <Instagram className="w-4.5 h-4.5 text-[#c9a84c]" /> Follow us on Instagram
            </a>

            {/* Explore Bestsellers */}
            <Link 
              href="/products" 
              className="w-full h-12 border border-[#E8DFC8] text-[#1C3829] rounded-full text-xs font-bold hover:border-[#1C3829] transition-all flex items-center justify-center gap-2 bg-transparent"
            >
              Explore Collection <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
