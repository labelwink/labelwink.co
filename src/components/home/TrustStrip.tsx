import { Truck, ShieldCheck, HeartHandshake, CreditCard } from 'lucide-react';

interface TrustStripProps {
  threshold?: number;
}

export function TrustStrip({ threshold = 3499 }: TrustStripProps) {
  const features = [
    { icon: Truck, title: "Fast Delivery", description: "Quick dispatch & delivery" },
    { icon: HeartHandshake, title: "Easy Returns", description: "7-day return policy" },
    { icon: ShieldCheck, title: "Handcrafted in India", description: "Ethically made" },
    { icon: CreditCard, title: "Secure Pay", description: "UPI & Cards accepted" },
  ];

  return (
    <section className="bg-blush/20 py-8 border-y border-sage/20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {features.map((feature, idx) => (
            <div key={idx} className="flex flex-col items-center justify-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-teal shadow-sm border border-sage/10">
                <feature.icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="font-semibold text-charcoal text-sm tracking-wide uppercase">{feature.title}</h4>
                <p className="text-[10px] text-charcoal/70 mt-1 uppercase tracking-widest">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
