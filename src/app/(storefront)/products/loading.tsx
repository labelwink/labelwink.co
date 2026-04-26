export default function ProductsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6 animate-pulse">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[4/5] bg-gray-100 rounded-xl" />
            <div className="h-4 w-3/4 bg-gray-100 rounded" />
            <div className="h-4 w-1/3 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
