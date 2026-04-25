'use client';

import { useState, useEffect } from 'react';
import { Star, CheckCircle, Flag, Trash2, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const supabase = createClient();

  async function fetchReviews() {
    setLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        products (name),
        users (name)
      `)
      .order('created_at', { ascending: false });
    
    if (data) setReviews(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchReviews();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('reviews')
      .update({ status })
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to update review status');
    } else {
      toast.success(`Review ${status}`);
      fetchReviews();
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to delete review');
    } else {
      toast.success('Review deleted');
      fetchReviews();
    }
  };

  const filteredReviews = reviews.filter(r => r.status === activeTab);
  const counts = {
    pending: reviews.filter(r => r.status === 'pending').length,
    approved: reviews.filter(r => r.status === 'approved').length,
    flagged: reviews.filter(r => r.status === 'flagged').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-semibold text-charcoal">Reviews</h1>
          <p className="text-muted-foreground text-sm mt-1 uppercase tracking-widest text-[10px] font-bold">Moderate customer reviews and manage feedback</p>
        </div>
      </div>

      <div className="bg-white border border-sage/20 rounded-xl shadow-sm p-8">
        {/* Tabs */}
        <div className="flex items-center gap-8 border-b border-sage/10 pb-4 mb-8">
          {(['pending', 'approved', 'flagged'] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs font-bold uppercase tracking-[0.2em] pb-3 border-b-2 transition-all flex items-center gap-3 ${activeTab === tab ? 'border-teal text-teal' : 'border-transparent text-muted-foreground hover:text-charcoal'}`}
              style={{ marginBottom: '-17px' }}
            >
              {tab}
              {counts[tab] > 0 && (
                <span className={`text-[9px] px-2 py-0.5 rounded-full ${activeTab === tab ? 'bg-teal text-white' : 'bg-sage/10 text-muted-foreground'}`}>
                  {counts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-10 h-10 animate-spin mx-auto text-teal/40" />
              <p className="text-xs text-muted-foreground uppercase tracking-widest mt-4">Loading feedback...</p>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="py-20 text-center bg-sage/5 rounded-xl border border-dashed border-sage/20">
              <MessageSquare className="w-12 h-12 text-sage/30 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground italic font-medium">No {activeTab} reviews found.</p>
            </div>
          ) : (
            filteredReviews.map((review) => (
              <div key={review.id} className="p-6 border border-sage/10 rounded-xl hover:bg-sage/5 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-charcoal tracking-tight">{review.products?.name}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold uppercase tracking-widest text-teal">{review.users?.name || 'Guest'}</span>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter opacity-60">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex text-yellow-500">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className={`w-4 h-4 ${i <= review.rating ? 'fill-current' : 'text-gray-200'}`} />
                    ))}
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-sage/10 mb-6 shadow-sm">
                  {review.title && <p className="text-sm font-bold text-charcoal mb-2">{review.title}</p>}
                  <p className="text-sm text-charcoal/70 leading-relaxed italic">"{review.body}"</p>
                </div>
                
                <div className="flex items-center gap-3 pt-4 border-t border-sage/10 opacity-0 group-hover:opacity-100 transition-opacity">
                  {activeTab !== 'approved' && (
                    <Button 
                      size="sm" 
                      onClick={() => updateStatus(review.id, 'approved')}
                      className="bg-green-600 hover:bg-green-700 text-white rounded-none uppercase tracking-widest text-[9px] font-bold h-9"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-2" /> Approve
                    </Button>
                  )}
                  {activeTab !== 'flagged' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateStatus(review.id, 'flagged')}
                      className="text-orange-600 border-orange-200 hover:bg-orange-50 rounded-none uppercase tracking-widest text-[9px] font-bold h-9"
                    >
                      <Flag className="w-3.5 h-3.5 mr-2" /> Flag
                    </Button>
                  )}
                  {activeTab !== 'pending' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => updateStatus(review.id, 'pending')}
                      className="text-charcoal border-sage/30 hover:bg-sage/5 rounded-none uppercase tracking-widest text-[9px] font-bold h-9"
                    >
                      <Clock className="w-3.5 h-3.5 mr-2" /> Mark Pending
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => deleteReview(review.id)}
                    className="ml-auto text-destructive hover:bg-destructive/5 rounded-none"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
