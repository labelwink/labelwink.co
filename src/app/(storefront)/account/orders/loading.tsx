export default function AccountOrdersLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4 animate-pulse">
      <div className="h-7 w-36 bg-gray-100 rounded-lg" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <div className="flex justify-between">
            <div className="h-4 w-32 bg-gray-100 rounded" />
            <div className="h-5 w-20 bg-gray-100 rounded-full" />
          </div>
          <div className="h-3 w-48 bg-gray-100 rounded" />
          <div className="flex gap-3 pt-1">
            <div className="w-12 h-14 bg-gray-100 rounded-lg" />
            <div className="w-12 h-14 bg-gray-100 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}
