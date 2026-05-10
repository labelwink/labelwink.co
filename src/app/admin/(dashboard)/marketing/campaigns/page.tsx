'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Send, 
  Clock, 
  FileText, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  Copy,
  Users,
  ChevronRight,
  Loader2,
  Calendar,
  Search,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type CampaignStatus = 'draft' | 'scheduled' | 'sent';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  preview_text: string;
  body_html: string;
  segment: string;
  status: CampaignStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  recipient_count: number;
  actual_sends: number;
  created_at: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [subscribersCount, setSubscribersCount] = useState(0);

  useEffect(() => {
    fetchCampaigns();
    fetchStats();
  }, [filterStatus]);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch(`/api/admin/campaigns?status=${filterStatus}`);
      const data = await res.json();
      setCampaigns(data);
    } catch (err) {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/newsletter/stats'); // I'll need to create this or handle it here
      const data = await res.json();
      setSubscribersCount(data.total_active || 0);
    } catch (err) {
      console.error('Failed to fetch stats');
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) return;
    try {
      const res = await fetch(`/api/admin/campaigns/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Campaign deleted');
        fetchCampaigns();
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch (err) {
      toast.error('Failed to delete campaign');
    }
  };

  const startSend = async (id: string) => {
    if (!confirm('Start sending this campaign to all recipients in the segment?')) return;
    try {
      const res = await fetch(`/api/admin/campaigns/${id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (res.ok) {
        toast.success('Campaign sending started!');
        fetchCampaigns();
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch (err) {
      toast.error('Failed to start sending');
    }
  };

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading text-charcoal mb-2">Email Campaigns</h1>
          <p className="text-muted-foreground">Manage and track your marketing email campaigns.</p>
        </div>
        <button 
          onClick={() => { setSelectedCampaign(null); setIsModalOpen(true); }}
          className="bg-white text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-charcoal/90 transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" /> Create Campaign
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Sent" value={campaigns.filter(c => c.status === 'sent').reduce((acc, c) => acc + c.recipient_count, 0)} icon={Send} color="teal" />
        <StatCard title="Active Subscribers" value={subscribersCount} icon={Users} color="indigo" />
        <StatCard title="Scheduled" value={campaigns.filter(c => c.status === 'scheduled').length} icon={Calendar} color="amber" />
        <StatCard title="Drafts" value={campaigns.filter(c => c.status === 'draft').length} icon={FileText} color="slate" />
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 p-1 bg-sage/10 rounded-2xl w-fit">
        {['all', 'draft', 'scheduled', 'sent'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold capitalize transition-all",
              filterStatus === status 
                ? "bg-white text-charcoal shadow-md" 
                : "text-muted-foreground hover:text-charcoal"
            )}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Campaigns Table */}
      <div className="bg-white border border-sage/20 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-20 text-center">
            <Loader2 className="w-8 h-8 text-[#c9a84c] animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground italic">Loading campaigns...</p>
          </div>
        ) : campaigns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-sage/5 text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground border-b border-sage/10">
                <tr>
                  <th className="px-8 py-4">Campaign</th>
                  <th className="px-8 py-4">Segment</th>
                  <th className="px-8 py-4">Recipients</th>
                  <th className="px-8 py-4">Date</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage/10 text-sm">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-sage/5 transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-bold text-charcoal">{c.name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">{c.subject}</div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="capitalize text-xs font-medium bg-sage/10 px-2 py-1 rounded-md text-charcoal/70">
                        {c.segment.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-5 font-mono">
                      {c.status === 'sent' ? c.recipient_count : '—'}
                    </td>
                    <td className="px-8 py-5 text-muted-foreground">
                      {c.sent_at 
                        ? format(new Date(c.sent_at), 'MMM dd, yyyy') 
                        : c.scheduled_at 
                          ? format(new Date(c.scheduled_at), 'MMM dd, HH:mm')
                          : '—'}
                    </td>
                    <td className="px-8 py-5">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        {c.status === 'draft' && (
                          <>
                            <button onClick={() => startSend(c.id)} className="p-2 hover:bg-teal/10 text-teal rounded-lg transition-colors" title="Send Now"><Send className="w-4 h-4" /></button>
                            <button onClick={() => { setSelectedCampaign(c); setIsModalOpen(true); }} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => deleteCampaign(c.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                          </>
                        )}
                        {c.status === 'scheduled' && (
                          <button onClick={() => { setSelectedCampaign(c); setIsModalOpen(true); }} className="p-2 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors" title="Edit Schedule"><Calendar className="w-4 h-4" /></button>
                        )}
                        {c.status === 'sent' && (
                          <button className="p-2 hover:bg-charcoal/10 text-charcoal rounded-lg transition-colors" title="View Stats"><Eye className="w-4 h-4" /></button>
                        )}
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
              <FileText className="w-8 h-8 text-sage" />
            </div>
            <h3 className="text-xl font-heading text-charcoal">No campaigns found</h3>
            <p className="text-muted-foreground italic mb-6">Start by creating your first marketing campaign.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-[#c9a84c] font-bold hover:underline"
            >
              + Create Campaign
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <CampaignModal 
          campaign={selectedCampaign} 
          onClose={() => { setIsModalOpen(false); setSelectedCampaign(null); }} 
          onSuccess={() => { setIsModalOpen(false); fetchCampaigns(); }}
        />
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    teal: "text-teal bg-teal/10",
    indigo: "text-indigo-600 bg-indigo-50",
    amber: "text-amber-600 bg-amber-50",
    slate: "text-slate-600 bg-slate-50"
  };
  
  return (
    <div className="bg-white border border-sage/20 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("p-2 rounded-xl", colors[color])}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{title}</span>
      </div>
      <div className="text-3xl font-heading text-charcoal">{value.toLocaleString()}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: CampaignStatus }) {
  const styles = {
    draft: "bg-slate-100 text-slate-700",
    scheduled: "bg-amber-100 text-amber-700",
    sent: "bg-teal-100 text-teal-700"
  };
  return (
    <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", styles[status])}>
      {status}
    </span>
  );
}

function CampaignModal({ campaign, onClose, onSuccess }: { campaign: any, onClose: () => void, onSuccess: () => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    subject: campaign?.subject || '',
    preview_text: campaign?.preview_text || '',
    body_html: campaign?.body_html || '',
    segment: campaign?.segment || 'all',
    scheduled_at: campaign?.scheduled_at ? format(new Date(campaign.scheduled_at), "yyyy-MM-dd'T'HH:mm") : ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = campaign ? `/api/admin/campaigns/${campaign.id}` : '/api/admin/campaigns';
      const method = campaign ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        toast.success(campaign ? 'Campaign updated' : 'Campaign created');
        onSuccess();
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch (err) {
      toast.error('Failed to save campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-charcoal/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#faf7f2] w-full max-w-5xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-sage/20">
        {/* Modal Header */}
        <div className="p-8 border-b border-sage/10 bg-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-heading text-charcoal">{campaign ? 'Edit Campaign' : 'Create New Campaign'}</h2>
            <div className="flex gap-4 mt-2">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex items-center gap-2">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                    step === s ? "bg-charcoal text-white" : step > s ? "bg-teal text-white" : "bg-sage/20 text-muted-foreground"
                  )}>
                    {step > s ? '✓' : s}
                  </div>
                  <span className={cn("text-[10px] font-bold uppercase tracking-widest", step >= s ? "text-charcoal" : "text-muted-foreground")}>
                    {s === 1 ? 'Content' : s === 2 ? 'Audience' : 'Schedule'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-sage/10 rounded-full transition-colors"><XCircle className="w-6 h-6 text-muted-foreground" /></button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-8 bg-sage/5">
          <form id="campaign-form" onSubmit={handleSubmit} className="space-y-8">
            {step === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Internal Campaign Name</label>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-5 py-4 rounded-xl bg-white border border-sage/20 focus:ring-1 focus:ring-charcoal outline-none transition-all"
                      placeholder="e.g. Summer Collection Launch 2024"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Subject Line</label>
                    <input 
                      type="text" 
                      value={formData.subject} 
                      onChange={e => setFormData({...formData, subject: e.target.value})}
                      className="w-full px-5 py-4 rounded-xl bg-white border border-sage/20 focus:ring-1 focus:ring-charcoal outline-none transition-all"
                      placeholder="e.g. Our Summer Essentials Are Here! ✨"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Preview Text</label>
                    <input 
                      type="text" 
                      value={formData.preview_text} 
                      onChange={e => setFormData({...formData, preview_text: e.target.value})}
                      className="w-full px-5 py-4 rounded-xl bg-white border border-sage/20 focus:ring-1 focus:ring-charcoal outline-none transition-all"
                      placeholder="e.g. Discover the grace in every thread with our new collection."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email Body (HTML)</label>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setFormData({...formData, body_html: formData.body_html + '{{store_name}}'})} className="text-[10px] bg-charcoal/5 px-2 py-1 rounded hover:bg-charcoal/10">Add {'{{store_name}}'}</button>
                        <button type="button" onClick={() => setFormData({...formData, body_html: formData.body_html + '{{unsubscribe_url}}'})} className="text-[10px] bg-charcoal/5 px-2 py-1 rounded hover:bg-charcoal/10">Add {'{{unsubscribe_url}}'}</button>
                      </div>
                    </div>
                    <textarea 
                      value={formData.body_html} 
                      onChange={e => setFormData({...formData, body_html: e.target.value})}
                      className="w-full h-80 px-5 py-4 rounded-xl bg-white border border-sage/20 focus:ring-1 focus:ring-charcoal outline-none transition-all font-mono text-xs leading-relaxed"
                      placeholder="<h1>Hello!</h1><p>Check out our new products...</p>"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5 h-full">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Live Preview</label>
                  <div className="bg-white border border-sage/20 rounded-2xl h-[calc(100%-2rem)] overflow-hidden">
                    {formData.body_html ? (
                      <iframe 
                        className="w-full h-full"
                        srcDoc={formData.body_html.replace(/{{store_name}}/g, 'LabelWink').replace(/{{unsubscribe_url}}/g, '#')}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground italic text-sm">
                        Design your email to see preview
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-heading text-charcoal">Select Your Audience</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { id: 'all', label: 'All Subscribers', desc: 'Every active newsletter subscriber' },
                    { id: 'new_customers', label: 'New Customers', desc: 'Users who joined in the last 30 days' },
                    { id: 'high_value', label: 'High Value', desc: 'Customers who spent over ₹5,000' },
                    { id: 'loyalty_members', label: 'Loyalty Members', desc: 'Users with active Wink Points' },
                    { id: 'inactive', label: 'Inactive', desc: 'No orders in 90 days' },
                  ].map(seg => (
                    <button
                      key={seg.id}
                      type="button"
                      onClick={() => setFormData({...formData, segment: seg.id})}
                      className={cn(
                        "text-left p-6 rounded-2xl border-2 transition-all group",
                        formData.segment === seg.id 
                          ? "border-[#c9a84c] bg-[#c9a84c]/5 shadow-lg" 
                          : "border-sage/10 bg-white hover:border-sage/30"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors",
                        formData.segment === seg.id ? "bg-[#c9a84c] text-white" : "bg-sage/10 text-muted-foreground group-hover:bg-sage/20"
                      )}>
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-charcoal mb-1">{seg.label}</div>
                      <div className="text-xs text-muted-foreground leading-relaxed">{seg.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="max-w-xl mx-auto space-y-8">
                <h3 className="text-xl font-heading text-charcoal text-center">Final Step: Choose When to Send</h3>
                
                <div className="space-y-4">
                  <div className="p-6 bg-white border border-sage/20 rounded-2xl">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="schedule" 
                        checked={!formData.scheduled_at} 
                        onChange={() => setFormData({...formData, scheduled_at: ''})}
                        className="w-5 h-5 accent-charcoal"
                      />
                      <div>
                        <div className="font-bold text-charcoal group-hover:text-charcoal transition-colors">Send Now</div>
                        <p className="text-xs text-muted-foreground">Launch this campaign immediately after saving.</p>
                      </div>
                    </label>
                  </div>

                  <div className="p-6 bg-white border border-sage/20 rounded-2xl">
                    <label className="flex items-center gap-3 cursor-pointer group mb-4">
                      <input 
                        type="radio" 
                        name="schedule" 
                        checked={!!formData.scheduled_at} 
                        onChange={() => setFormData({...formData, scheduled_at: format(new Date(), "yyyy-MM-dd'T'HH:mm")})}
                        className="w-5 h-5 accent-charcoal"
                      />
                      <div>
                        <div className="font-bold text-charcoal group-hover:text-charcoal transition-colors">Schedule for Later</div>
                        <p className="text-xs text-muted-foreground">Pick a specific date and time for the launch.</p>
                      </div>
                    </label>

                    {formData.scheduled_at && (
                      <div className="pl-8 transition-all animate-in slide-in-from-top-2 duration-300">
                        <input 
                          type="datetime-local" 
                          value={formData.scheduled_at}
                          onChange={e => setFormData({...formData, scheduled_at: e.target.value})}
                          className="w-full px-5 py-4 rounded-xl bg-sage/5 border border-sage/20 focus:ring-1 focus:ring-charcoal outline-none transition-all font-mono"
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-[#c9a84c]/5 border border-[#c9a84c]/20 rounded-2xl p-6 flex gap-4">
                  <Info className="w-5 h-5 text-[#c9a84c] flex-shrink-0" />
                  <p className="text-xs text-charcoal/70 leading-relaxed italic">
                    Sent campaigns cannot be edited or deleted. Please double-check your content before launching.
                  </p>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-8 border-t border-sage/10 bg-white flex justify-between items-center">
          <button 
            type="button"
            onClick={onClose}
            className="text-muted-foreground font-bold hover:text-charcoal transition-colors text-sm"
          >
            Cancel
          </button>
          
          <div className="flex gap-4">
            {step > 1 && (
              <button 
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-8 py-3 rounded-xl font-bold border border-sage/20 hover:bg-sage/5 transition-all text-sm"
              >
                Back
              </button>
            )}
            
            {step < 3 ? (
              <button 
                type="button"
                onClick={() => setStep(step + 1)}
                className="bg-white text-white px-8 py-3 rounded-xl font-bold hover:bg-charcoal transition-all text-sm flex items-center gap-2"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                form="campaign-form"
                type="submit"
                disabled={loading}
                className="bg-[#c9a84c] text-[#ffffff] px-8 py-3 rounded-xl font-bold hover:bg-[#b8973d] transition-all text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {formData.scheduled_at ? 'Schedule Campaign' : 'Save & Send Now'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
