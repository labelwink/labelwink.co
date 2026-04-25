interface Column<T> {
  key: string
  label: string
  render?: (row: T) => React.ReactNode
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[]
  rows: T[]
  emptyMessage?: string
}

export function DataTable<T extends Record<string, unknown>>({ columns, rows, emptyMessage = 'No data found' }: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-16 text-[#6b7280]">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-sm font-medium">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#e5e7eb]">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[#1b3a34] text-white">
            {columns.map((col) => (
              <th key={col.key} className="text-left px-4 py-3 font-medium text-sm whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={`border-t border-[#e5e7eb] hover:bg-[#f0fdf4] transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}`}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3">
                  {col.render ? col.render(row) : String(row[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
