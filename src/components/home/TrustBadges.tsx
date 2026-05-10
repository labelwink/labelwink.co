const BADGES = [
  { icon: '🚚', title: 'Fast Delivery', sub: 'Orders processed quickly' },
  { icon: '↩️', title: 'Easy Returns', sub: '7-day return policy' },
  { icon: '🔒', title: 'Secure Payment', sub: 'Razorpay secured' },
  { icon: '✨', title: 'Authentic Products', sub: '100% original ethnic wear' },
];

export function TrustBadges() {
  return (
    <section className="border-t border-b border-gray-200 py-8 px-4 bg-white">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto text-center">
        {BADGES.map(b => (
          <div key={b.title} className="flex flex-col items-center gap-2">
            <span className="text-3xl">{b.icon}</span>
            <p className="font-semibold text-[#1a3a34] text-sm">{b.title}</p>
            <p className="text-[#9aab9e] text-xs">{b.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
