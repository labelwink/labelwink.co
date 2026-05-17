'use client';

import { useState } from 'react';
import { saveLegalSettings } from './actions';
import { toast } from 'sonner';

export default function LegalSettingsForm({ initialData }: { initialData: any }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    site_name: initialData?.site_name || 'LabelWink',
    legal_entity_name: initialData?.legal_entity_name || '',
    registered_address: initialData?.registered_address || '',
    gstin: initialData?.gstin || '',
    cin: initialData?.cin || '',
    support_email: initialData?.support_email || '',
    support_phone: initialData?.support_phone || '',
    grievance_officer_name: initialData?.grievance_officer_name || '',
    grievance_officer_email: initialData?.grievance_officer_email || '',
    grievance_officer_phone: initialData?.grievance_officer_phone || '',
    grievance_officer_designation: initialData?.grievance_officer_designation || 'Grievance Officer',
    grievance_hours: initialData?.grievance_hours || 'Monday–Friday, 10 AM – 6 PM IST',
    grievance_acknowledgement_sla: initialData?.grievance_acknowledgement_sla || '48 hours',
    grievance_resolution_sla: initialData?.grievance_resolution_sla || '30 days',
    website_url: initialData?.website_url || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const res = await saveLegalSettings(data);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success('Settings saved successfully');
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Company Info */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 text-[#1C3829]">Legal Entity Details</h2>
        <p className="text-sm text-gray-500 mb-4">This information will appear in the public footer to comply with Consumer Protection (E-Commerce) Rules, 2020.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
            <input type="text" name="site_name" value={data.site_name} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Legal Entity Name</label>
            <input type="text" name="legal_entity_name" value={data.legal_entity_name} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 text-sm" required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Registered Address</label>
            <textarea name="registered_address" value={data.registered_address} onChange={handleChange} rows={3} className="w-full rounded-md border border-gray-300 p-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
            <input type="text" name="gstin" value={data.gstin} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CIN (if applicable)</label>
            <input type="text" name="cin" value={data.cin} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 text-sm" />
          </div>
        </div>
      </div>

      {/* Support Info */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 text-[#1C3829]">General Support Contact</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
            <input type="email" name="support_email" value={data.support_email} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Support Phone</label>
            <input type="text" name="support_phone" value={data.support_phone} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 text-sm" required />
          </div>
        </div>
      </div>

      {/* Grievance Officer */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 text-[#1C3829]">Grievance Officer Details</h2>
        <p className="text-sm text-gray-500 mb-4">Mandatory under IT Rules, 2021.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" name="grievance_officer_name" value={data.grievance_officer_name} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
            <input type="text" name="grievance_officer_designation" value={data.grievance_officer_designation} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="grievance_officer_email" value={data.grievance_officer_email} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="text" name="grievance_officer_phone" value={data.grievance_officer_phone} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 text-sm" required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Operating Hours</label>
            <input type="text" name="grievance_hours" value={data.grievance_hours} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Acknowledgement SLA</label>
            <input type="text" name="grievance_acknowledgement_sla" value={data.grievance_acknowledgement_sla} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resolution SLA</label>
            <input type="text" name="grievance_resolution_sla" value={data.grievance_resolution_sla} onChange={handleChange} className="w-full rounded-md border border-gray-300 p-2 text-sm" required />
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-gray-50 py-4 border-t border-gray-200 mt-6 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#C9A84C] text-[#1C3829] px-6 py-2 rounded-md font-semibold hover:bg-[#d4b76a] transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
}
