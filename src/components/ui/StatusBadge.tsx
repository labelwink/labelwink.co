// src/components/ui/StatusBadge.tsx

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid:         'bg-emerald-50 text-emerald-700 border-emerald-200',
    delivered:    'bg-emerald-50 text-emerald-700 border-emerald-200',
    active:       'bg-emerald-50 text-emerald-700 border-emerald-200',
    approved:     'bg-emerald-50 text-emerald-700 border-emerald-200',
    confirmed:    'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending:      'bg-amber-50   text-amber-700   border-amber-200',
    processing:   'bg-amber-50   text-amber-700   border-amber-200',
    shipped:      'bg-amber-50   text-amber-700   border-amber-200',
    packed:       'bg-indigo-50  text-indigo-700  border-indigo-200',
    cancelled:    'bg-red-50     text-red-700     border-red-200',
    rejected:     'bg-red-50     text-red-700     border-red-200',
    out_of_stock: 'bg-red-50     text-red-700     border-red-200',
    refunded:     'bg-blue-50    text-blue-700    border-blue-200',
    returned:     'bg-blue-50    text-blue-700    border-blue-200',
    return_requested: 'bg-orange-50 text-orange-700 border-orange-200',
    inactive:     'bg-gray-50    text-gray-600    border-gray-200',
  }
  const cls = map[status.toLowerCase()] ?? 'bg-gray-50 text-gray-700 border-gray-200'
  const label = status.replace(/_/g, ' ')
  return (
    <span className={`inline-flex items-center border text-xs font-medium px-2.5 py-0.5 rounded-full ${cls}`}>
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </span>
  )
}
