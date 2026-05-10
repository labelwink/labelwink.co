import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-8xl font-black text-[#1b3a34] leading-none">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mt-4">Page not found</h2>
      <p className="text-[#9aab9e] mt-2 mb-8 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex items-center gap-0 flex-wrap justify-center">
        <Link
          href="/"
          className="bg-[#1b3a34] text-white px-8 py-3 rounded-xl font-medium hover:bg-[#234d44] transition-colors"
        >
          Go Back Home
        </Link>
        <Link
          href="/collections/all"
          className="border border-[#1b3a34] text-[#1b3a34] px-8 py-3 rounded-xl font-medium ml-4 hover:bg-[#f0fdf4] transition-colors"
        >
          View Products
        </Link>
      </div>
    </div>
  )
}
