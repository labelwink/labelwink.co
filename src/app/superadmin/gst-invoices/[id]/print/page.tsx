'use client'

import { use } from 'react'
import { useEffect, useState } from 'react'

interface GSTInvoice {
  id: string
  invoice_number: string
  order_id: string
  order_number: string
  customer_name: string
  customer_email: string
  invoice_date: string
  subtotal: number
  gst_rate: number
  gst_type: 'CGST+SGST' | 'IGST'
  cgst: number
  sgst: number
  igst: number
  total: number
  notes: string
  status: string
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)
}

export default function PrintInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [invoice, setInvoice] = useState<GSTInvoice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/gst-invoices/${id}`)
      .then(r => r.json())
      .then(data => { setInvoice(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (invoice) setTimeout(() => window.print(), 500)
  }, [invoice])

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-500">Loading invoice…</div>
  if (!invoice) return <div className="flex items-center justify-center min-h-screen text-red-500">Invoice not found</div>

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          @page { size: A4; margin: 20mm; }
        }
        body { font-family: 'Inter', Arial, sans-serif; }
      `}</style>

      {/* Print Button */}
      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button onClick={() => window.print()}
          className="px-4 py-2 bg-[#1C3829] text-white text-sm font-semibold rounded-lg hover:bg-[#24472F]">
          Print / Download PDF
        </button>
        <button onClick={() => window.close()}
          className="px-4 py-2 border border-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-50">
          Close
        </button>
      </div>

      <div className="max-w-[210mm] mx-auto bg-white p-12 min-h-[297mm] text-gray-900">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="text-2xl font-bold text-[#1C3829] mb-1">LabelWink</div>
            <p className="text-xs text-gray-500">GST Registered · GSTIN: PENDING</p>
            <p className="text-xs text-gray-500">Support@labelwink.co</p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-gray-900 mb-1">TAX INVOICE</div>
            <p className="text-xs text-gray-600 font-mono font-semibold">{invoice.invoice_number}</p>
            <p className="text-xs text-gray-500 mt-1">Date: {fmtDate(invoice.invoice_date)}</p>
            <div className={`mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {invoice.status}
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Bill To</p>
          <p className="font-semibold text-gray-900">{invoice.customer_name}</p>
          <p className="text-sm text-gray-600">{invoice.customer_email}</p>
          <p className="text-xs text-gray-500 mt-1">Order Ref: {invoice.order_number}</p>
        </div>

        {/* Line Items */}
        <table className="w-full text-sm mb-8 border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-2 text-xs font-bold uppercase tracking-wide text-gray-500">Description</th>
              <th className="text-right py-2 text-xs font-bold uppercase tracking-wide text-gray-500">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-3 text-gray-800">Fashion Products (Order {invoice.order_number})</td>
              <td className="py-3 text-right font-medium">{fmt(invoice.subtotal)}</td>
            </tr>
          </tbody>
        </table>

        {/* GST Breakdown */}
        <div className="ml-auto w-72 space-y-1.5 mb-8">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{fmt(invoice.subtotal)}</span>
          </div>
          {invoice.gst_type === 'CGST+SGST' ? (
            <>
              <div className="flex justify-between text-sm text-gray-600">
                <span>CGST @ {invoice.gst_rate / 2}%</span>
                <span>{fmt(invoice.cgst)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>SGST @ {invoice.gst_rate / 2}%</span>
                <span>{fmt(invoice.sgst)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-sm text-gray-600">
              <span>IGST @ {invoice.gst_rate}%</span>
              <span>{fmt(invoice.igst)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-2 border-t-2 border-gray-300">
            <span>Total</span>
            <span className="text-[#1C3829]">{fmt(invoice.total)}</span>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg mb-8">
            <p className="text-xs font-semibold text-amber-700 mb-1">Notes</p>
            <p className="text-sm text-gray-700">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
          <p>Thank you for shopping with LabelWink · labelwink.co</p>
          <p className="mt-1">This is a computer-generated invoice and does not require a physical signature.</p>
        </div>
      </div>
    </>
  )
}
