'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Tag, 
  Clock, 
  Calendar, 
  MoreVertical, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ChevronRight,
  Info,
  AlertCircle,
  Zap,
  Package,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isAfter, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';

interface SeasonalSale {
  id: string;
  name: string;
  discount_percent: number;
  applies_to: 'all' | 'collections' | 'products';
  collection_ids: string[];
  product_ids: string[];
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
}

export default function SeasonalSalesPage() {
  const [sales, setSales] = useState<SeasonalSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SeasonalSale | null>(null);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const res = await fetch('/api/admin/seasonal-sales');
      const data = await res.json();
      if (res.ok) setSales(data);
      else toast.error(data.error || 'Failed to fetch sales');
    } catch (err) {
      toast.error('Failed to load seasonal sales');
    } finally {
      setLoading(false);
    }
  };

  const deleteSale = async (id: string) => {
    if (!confirm('Are you sure? If the sale is active, prices will be restored before deletion.')) return;
    try {
      const res = await fetch(`/api/admin/seasonal-sales/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Sale deleted and prices restored');
        fetchSales();
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch (err) {
      toast.error('Failed to delete sale');
    }
  };

  const toggleActivation = async (sale: SeasonalSale) => {
    const newStatus = !sale.is_active;
    const toastId = toast.loading(`${newStatus ? 'Activating' : 'Deactivating'} sale and updating prices...`);
    
    try {
      const res = await fetch(`/api/admin/seasonal-sales/${sale.id}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activate: newStatus })
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success(`Sale ${newStatus ? 'activated' : 'deactivated'} successfully. ${data.affected} products updated.`, { id: toastId });
        fetchSales();
      } else {
        toast.error(data.error || 'Operation failed', { id: toastId });
      }
    } catch (err) {
      toast.error('Network error occurred', { id: toastId });
    }
  };

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading text-charcoal mb-2">Seasonal Sales</h1>
          <p className="text-muted-foreground italic">Automated site-wide or category-specific price adjustments.</p>
        </div>
        <button 
          onClick={() => { setSelectedSale(null); setIsModalOpen(true); }}
          className="bg-white text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-charcoal/90 transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" /> Create New Sale
        </button>
      </div>

      {/* Sale Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SaleSummaryCard 
          title="Active Now" 
          count={sales.filter(s => s.is_active).length} 
          icon={Zap} 
          color="teal" 
        />
        <SaleSummaryCard 
          title="Scheduled" 
          count={sales.filter(s => !s.is_active && isAfter(new Date(s.starts_at), new Date())).length} 
          icon={Clock} 
          color="amber" 
        />
        <SaleSummaryCard 
          title="Past Sales" 
          count={sales.filter(s => isBefore(new Date(s.ends_at), new Date())).length} 
          icon={Calendar} 
          color="slate" 
        />
      </div>

      {/* Sales List */}
      <div className="bg-white border border-sage/20 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-20 text-center">
            <Loader2 className="w-8 h-8 text-[#c9a84c] animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground italic">Loading sales configurations...</p>
          </div>
        ) : sales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-sage/5 text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground border-b border-sage/10">
                <tr>
                  <th className="px-8 py-4">Sale Name</th>
                  <th className="px-8 py-4">Discount</th>
                  <th className="px-8 py-4">Targeting</th>
                  <th className="px-8 py-4">Duration</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage/10 text-sm">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-sage/5 transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-bold text-charcoal">{sale.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">ID: {sale.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-teal" />
                        <span className="font-bold text-teal">{sale.discount_percent}% OFF</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        {sale.applies_to === 'all' && <Zap className="w-3.5 h-3.5 text-amber-500" />}
                        {sale.applies_to === 'collections' && <Layers className="w-3.5 h-3.5 text-indigo-500" />}
                        {sale.applies_to === 'products' && <Package className="w-3.5 h-3.5 text-slate-500" />}
                        <span className="capitalize text-xs font-medium">{sale.applies_to}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-muted-foreground text-xs">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(new Date(sale.starts_at), 'MMM dd, HH:mm')}</div>
                        <div className="flex items-center gap-1 opacity-60"><Calendar className="w-3 h-3" /> {format(new Date(sale.ends_at), 'MMM dd, HH:mm')}</div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <button 
                        onClick={() => toggleActivation(sale)}
                        className={cn(
                          "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border",
                          sale.is_active 
                            ? "bg-teal text-white border-teal shadow-md" 
                            : "bg-white text-muted-foreground border-sage/20 hover:border-sage/40"
                        )}
                      >
                        {sale.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => { setSelectedSale(sale); setIsModalOpen(true); }}
                          className="p-2 hover:bg-charcoal/5 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4 text-charcoal/60" />
                        </button>
                        <button 
                          onClick={() => deleteSale(sale.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-500/60" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-20 text-center">
            <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-sage" />
            </div>
            <h3 className="text-xl font-heading text-charcoal">No seasonal sales found</h3>
            <p className="text-muted-foreground italic mb-6">Create your first sale event to boost conversions.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-[#c9a84c] text-[#ffffff] px-6 py-2.5 rounded-xl font-bold hover:bg-[#b8973d] transition-all"
            >
              + Create Sale
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <SaleModal 
          sale={selectedSale} 
          onClose={() => { setIsModalOpen(false); setSelectedSale(null); }} 
          onSuccess={() => { setIsModalOpen(false); fetchSales(); }}
        />
      )}
    </div>
  );
}

function SaleSummaryCard({ title, count, icon: Icon, color }: any) {
  const colors: any = {
    teal: "bg-teal/10 text-teal",
    amber: "bg-amber-50 text-amber-600",
    slate: "bg-slate-50 text-slate-600"
  };

  return (
    <div className="bg-white border border-sage/20 rounded-3xl p-6 shadow-sm flex items-center gap-4">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", colors[color])}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">{title}</div>
        <div className="text-2xl font-heading text-charcoal">{count}</div>
      </div>
    </div>
  );
}

function SaleModal({ sale, onClose, onSuccess }: { sale: SeasonalSale | null, onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: sale?.name || '',
    discount_percent: sale?.discount_percent || 10,
    applies_to: sale?.applies_to || 'all',
    collection_ids: sale?.collection_ids || [],
    product_ids: sale?.product_ids || [],
    starts_at: sale?.starts_at ? format(new Date(sale.starts_at), "yyyy-MM-dd'T'HH:mm") : '',
    ends_at: sale?.ends_at ? format(new Date(sale.ends_at), "yyyy-MM-dd'T'HH:mm") : '',
    is_active: sale?.is_active ?? false
  });

  useEffect(() => {
    fetchMeta();
  }, []);

  const fetchMeta = async () => {
    try {
      // Fetch categories/collections
      const catRes = await fetch('/api/admin/collections');
      const cats = await catRes.json();
      setCollections(cats);

      // Fetch sample products
      const prodRes = await fetch('/api/admin/products?pageSize=100');
      const prodData = await prodRes.json();
      setProducts(prodData.products || []);
    } catch (err) {
      console.error('Failed to fetch modal meta');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = sale ? `/api/admin/seasonal-sales/${sale.id}` : '/api/admin/seasonal-sales';
      const method = sale ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        toast.success(sale ? 'Sale updated' : 'Sale created');
        onSuccess();
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch (err) {
      toast.error('Failed to save sale');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-charcoal/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#faf7f2] w-full max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-sage/20">
        <div className="p-8 border-b border-sage/10 bg-white flex justify-between items-center">
          <h2 className="text-2xl font-heading text-charcoal">{sale ? 'Edit Seasonal Sale' : 'Create Seasonal Sale'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-sage/10 rounded-full transition-colors"><XCircle className="w-6 h-6 text-muted-foreground" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-sage/5">
          <form id="sale-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Campaign Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-5 py-4 rounded-xl bg-white border border-sage/20 focus:ring-1 focus:ring-charcoal outline-none transition-all"
                  placeholder="e.g. Diwali Flash Sale"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Discount Percent (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={formData.discount_percent} 
                    onChange={e => setFormData({...formData, discount_percent: Number(e.target.value)})}
                    className="w-full px-5 py-4 rounded-xl bg-white border border-sage/20 focus:ring-1 focus:ring-charcoal outline-none transition-all"
                    min="1" max="90"
                    required
                  />
                  <Tag className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-40" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Applies To</label>
                <select 
                  value={formData.applies_to} 
                  onChange={e => setFormData({...formData, applies_to: e.target.value as any})}
                  className="w-full px-5 py-4 rounded-xl bg-white border border-sage/20 focus:ring-1 focus:ring-charcoal outline-none transition-all appearance-none"
                >
                  <option value="all">Entire Store</option>
                  <option value="collections">Specific Collections</option>
                  <option value="products">Specific Products</option>
                </select>
              </div>

              {formData.applies_to === 'collections' && (
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Select Collections (Categories)</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-4 bg-white border border-sage/20 rounded-xl">
                    {collections.map(c => (
                      <label key={c.id} className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={formData.collection_ids.includes(c.id)}
                          onChange={e => {
                            const ids = e.target.checked 
                              ? [...formData.collection_ids, c.id]
                              : formData.collection_ids.filter(id => id !== c.id);
                            setFormData({...formData, collection_ids: ids});
                          }}
                          className="w-4 h-4 rounded border-sage/30 text-charcoal focus:ring-charcoal"
                        />
                        <span className="text-sm text-charcoal group-hover:text-charcoal transition-colors">{c.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {formData.applies_to === 'products' && (
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Select Products</label>
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto p-4 bg-white border border-sage/20 rounded-xl">
                    {products.map(p => (
                      <label key={p.id} className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={formData.product_ids.includes(p.id)}
                          onChange={e => {
                            const ids = e.target.checked 
                              ? [...formData.product_ids, p.id]
                              : formData.product_ids.filter(id => id !== p.id);
                            setFormData({...formData, product_ids: ids});
                          }}
                          className="w-4 h-4 rounded border-sage/30 text-charcoal focus:ring-charcoal"
                        />
                        <span className="text-sm text-charcoal group-hover:text-charcoal transition-colors">{p.name} (₹{p.price})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Start Date & Time</label>
                <input 
                  type="datetime-local" 
                  value={formData.starts_at} 
                  onChange={e => setFormData({...formData, starts_at: e.target.value})}
                  className="w-full px-5 py-4 rounded-xl bg-white border border-sage/20 focus:ring-1 focus:ring-charcoal outline-none transition-all font-mono text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">End Date & Time</label>
                <input 
                  type="datetime-local" 
                  value={formData.ends_at} 
                  onChange={e => setFormData({...formData, ends_at: e.target.value})}
                  className="w-full px-5 py-4 rounded-xl bg-white border border-sage/20 focus:ring-1 focus:ring-charcoal outline-none transition-all font-mono text-xs"
                  required
                />
              </div>
            </div>

            <div className="bg-[#c9a84c]/5 border border-[#c9a84c]/20 rounded-2xl p-6 flex gap-4">
              <AlertCircle className="w-5 h-5 text-[#c9a84c] flex-shrink-0" />
              <p className="text-xs text-charcoal/70 leading-relaxed italic">
                Active sales will automatically adjust store prices. Make sure to double-check the discount percentage and targeting.
              </p>
            </div>
          </form>
        </div>

        <div className="p-8 border-t border-sage/10 bg-white flex justify-between items-center">
          <button 
            type="button"
            onClick={onClose}
            className="text-muted-foreground font-bold hover:text-charcoal transition-colors text-sm"
          >
            Cancel
          </button>
          
          <button 
            form="sale-form"
            type="submit"
            disabled={loading}
            className="bg-white text-white px-10 py-4 rounded-xl font-bold hover:bg-charcoal transition-all text-sm disabled:opacity-50 flex items-center gap-2 shadow-xl"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {sale ? 'Update Sale Event' : 'Schedule Sale Event'}
          </button>
        </div>
      </div>
    </div>
  );
}
