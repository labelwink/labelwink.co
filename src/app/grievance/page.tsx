import { createAdminClient } from '@/lib/supabase/server';

export default async function GrievancePage() {
  const supabase = createAdminClient();
  const { data: legalSettings } = await supabase
    .from('site_legal_settings')
    .select('*')
    .limit(1)
    .single();

  const settings = legalSettings || {
    site_name: 'LabelWink',
    legal_entity_name: 'LabelWink Pvt Ltd',
    grievance_officer_name: 'SHIVA SHAKKTHI',
    grievance_officer_designation: 'Grievance Officer',
    grievance_officer_email: 'help@labelwink.co',
    grievance_officer_phone: '+91 9876543210',
    grievance_hours: 'Monday–Friday, 10 AM – 6 PM IST',
    grievance_acknowledgement_sla: '48 hours',
    grievance_resolution_sla: '30 days',
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-16 min-h-[60vh]">
      <h1 className="text-2xl font-bold mb-6 text-[#1C3829]">Grievance Redressal</h1>
      <p className="text-gray-600 mb-6">
        As per the Consumer Protection (E-Commerce) Rules, 2020 and IT Rules, 2021,
        {settings.site_name} ({settings.legal_entity_name}) has appointed a {settings.grievance_officer_designation} to address customer concerns.
      </p>
      <div className="bg-white rounded-lg p-6 space-y-3 text-sm border border-gray-200 shadow-sm">
        <p><strong className="text-gray-800">{settings.grievance_officer_designation}:</strong> {settings.grievance_officer_name}</p>
        <p><strong className="text-gray-800">Email:</strong> <a href={`mailto:${settings.grievance_officer_email}`} className="text-[#C9A84C] hover:underline font-medium">{settings.grievance_officer_email}</a></p>
        <p><strong className="text-gray-800">Phone:</strong> {settings.grievance_officer_phone}</p>
        <p><strong className="text-gray-800">Hours:</strong> {settings.grievance_hours}</p>
        <p><strong className="text-gray-800">Response Time:</strong> Acknowledgement within {settings.grievance_acknowledgement_sla}, Resolution within {settings.grievance_resolution_sla}</p>
      </div>
      <div className="mt-8 bg-gray-50 p-4 rounded-md border border-gray-100">
        <p className="text-sm text-gray-500">
          We take your concerns seriously and aim to resolve them promptly.
          If unresolved, you may escalate to the National Consumer Helpline: <a href="tel:1800114000" className="text-[#1C3829] font-medium">1800-11-4000</a>
        </p>
      </div>
    </main>
  );
}
