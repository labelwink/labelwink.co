import Link from 'next/link'

export default function PolicyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f9f9f9] py-8 px-4">
      <div className="max-w-[800px] mx-auto bg-white px-6 py-12 rounded-xl shadow-sm">
        {children}
      </div>
    </div>
  )
}
