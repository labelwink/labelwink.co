'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ArrowRight, Store, Package, Layout, Rocket, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminSetupWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const [storeData, setStoreData] = useState({
    name: 'Label Wink',
    email: '',
    whatsapp: ''
  });

  const [categoryData, setCategoryData] = useState({
    name: '',
    slug: ''
  });

  const handleStoreSetup = async () => {
    setLoading(true);
    await Promise.all([
      supabase.from('site_settings').upsert({ key: 'store_name', value: { name: storeData.name } }),
      supabase.from('site_settings').upsert({ key: 'store_email', value: { email: storeData.email } }),
      supabase.from('site_settings').upsert({ key: 'whatsapp_number', value: { number: storeData.whatsapp } }),
    ]);
    setLoading(false);
    setStep(2);
  };

  const handleCategorySetup = async () => {
    setLoading(true);
    const slug = categoryData.name.toLowerCase().replace(/ /g, '-');
    await supabase.from('categories').insert({
      name: categoryData.name,
      slug: slug,
      is_active: true
    });
    setLoading(false);
    setStep(3);
  };

  const handleCMSSetup = async () => {
    setLoading(true);
    // Activate some default sections
    await supabase.from('homepage_sections').update({ is_active: true }).in('section_key', ['announcement_bar', 'hero_banner', 'category_highlights', 'new_arrivals']);
    setLoading(false);
    setStep(4);
  };

  return (
    <div className="min-h-screen bg-cream/30 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white border border-sage/20 rounded-2xl shadow-xl overflow-hidden">
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-sage/10 flex">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className={`h-full flex-1 transition-all duration-500 ${i <= step ? 'bg-teal' : ''}`} 
            />
          ))}
        </div>

        <div className="p-10">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
              <div className="w-16 h-16 bg-teal/10 rounded-2xl flex items-center justify-center text-teal mb-6">
                <Store size={32} />
              </div>
              <h1 className="text-3xl font-heading font-bold text-charcoal">Store Basics</h1>
              <p className="text-muted-foreground text-sm">Tell us about your brand to get started.</p>
              
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-charcoal/60">Store Name</label>
                  <Input value={storeData.name} onChange={(e) => setStoreData({...storeData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-charcoal/60">WhatsApp Number</label>
                  <Input placeholder="e.g. 9876543210" value={storeData.whatsapp} onChange={(e) => setStoreData({...storeData, whatsapp: e.target.value})} />
                </div>

              </div>

              <Button onClick={handleStoreSetup} disabled={loading} className="w-full h-14 bg-charcoal text-white rounded-none uppercase tracking-widest font-bold mt-8">
                {loading ? <Loader2 className="animate-spin" /> : 'Continue'} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
              <div className="w-16 h-16 bg-teal/10 rounded-2xl flex items-center justify-center text-teal mb-6">
                <Package size={32} />
              </div>
              <h1 className="text-3xl font-heading font-bold text-charcoal">First Category</h1>
              <p className="text-muted-foreground text-sm">Create your first collection to organize products.</p>
              
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-charcoal/60">Category Name</label>
                  <Input placeholder="e.g. Kurta Sets" value={categoryData.name} onChange={(e) => setCategoryData({...categoryData, name: e.target.value})} />
                </div>
              </div>

              <Button onClick={handleCategorySetup} disabled={loading || !categoryData.name} className="w-full h-14 bg-charcoal text-white rounded-none uppercase tracking-widest font-bold mt-8">
                {loading ? <Loader2 className="animate-spin" /> : 'Create Category'} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
              <div className="w-16 h-16 bg-teal/10 rounded-2xl flex items-center justify-center text-teal mb-6">
                <Layout size={32} />
              </div>
              <h1 className="text-3xl font-heading font-bold text-charcoal">Design & Content</h1>
              <p className="text-muted-foreground text-sm">We'll activate the default homepage sections for you.</p>
              
              <div className="space-y-3 pt-4">
                {['Announcement Bar', 'Hero Banner', 'Category Highlights', 'New Arrivals'].map((item) => (
                  <div key={item} className="flex items-center gap-3 p-3 bg-sage/5 border border-sage/10 rounded-lg">
                    <CheckCircle2 size={16} className="text-teal" />
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>

              <Button onClick={handleCMSSetup} disabled={loading} className="w-full h-14 bg-charcoal text-white rounded-none uppercase tracking-widest font-bold mt-8">
                {loading ? <Loader2 className="animate-spin" /> : 'Finish Setup'} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}

          {step === 4 && (
            <div className="text-center space-y-6 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-teal text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-teal/20">
                <Rocket size={40} />
              </div>
              <h1 className="text-3xl font-heading font-bold text-charcoal">Ready to Launch!</h1>
              <p className="text-muted-foreground text-sm px-6">Your store's foundation is ready. Now add some beautiful products to start selling.</p>
              
              <div className="grid grid-cols-1 gap-4 pt-8">
                <Button onClick={() => router.push('/admin/products/add')} className="h-16 bg-teal text-white rounded-none uppercase tracking-widest font-bold">
                  Add Your First Product
                </Button>
                <Button onClick={() => router.push('/admin')} variant="outline" className="h-16 border-charcoal text-charcoal rounded-none uppercase tracking-widest font-bold">
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
