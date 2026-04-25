'use client'
import { IndianRupee, ShoppingBag, Users, TrendingUp, BarChart2 } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

interface AnalyticsClientProps {
  totalRevenue: number
  totalOrders: number
  avgOrderValue: number
  customerCount: number
  chartData: any[]
  topProducts: any[]
}

export default function AnalyticsClient({
  totalRevenue,
  totalOrders,
  avgOrderValue,
  customerCount,
  chartData,
  topProducts
}: AnalyticsClientProps) {
  const kpis = [
    { title: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-teal', bg: 'bg-teal/5' },
    { title: 'Total Orders', value: totalOrders, icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Avg Order Value', value: `₹${avgOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Total Customers', value: customerCount, icon: Users, color: 'text-orange-500', bg: 'bg-orange-50' },
  ]

  return (
    <div className="space-y-8 font-body">
      <div>
        <h1 className="admin-page-title">Analytics</h1>
        <p className="text-sm text-gray-400 mt-1">Deep dive into your store's performance metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white border border-sage/20 p-6 rounded-2xl shadow-sm">
            <div className={`w-12 h-12 rounded-xl ${kpi.bg} flex items-center justify-center mb-4`}>
              <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
            </div>
            <p className="admin-section-label mb-1">{kpi.title}</p>
            <h3 className="text-2xl font-bold text-charcoal">{kpi.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-sage/20 p-8 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-teal" /> Revenue Trend (Last 7 Days)
            </h3>
          </div>
          
          <div className="h-64">
            {chartData.every(d => d.revenue === 0) ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-sage/5 rounded-xl border border-dashed border-sage/20">
                <p className="text-3xl mb-2">📊</p>
                <p className="text-sm font-medium">No revenue data yet. Start selling to see analytics.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#016a6e" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#016a6e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }} 
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }} 
                    tickFormatter={v => `₹${v}`} 
                    axisLine={false}
                    tickLine={false}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} 
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#016a6e" strokeWidth={3} fill="url(#revenueGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white border border-sage/20 p-8 rounded-2xl shadow-sm">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gold" /> Top Products (30d)
          </h3>
          <div className="space-y-6">
            {topProducts.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground text-sm italic">No product sales yet.</p>
            ) : (
              topProducts.map((p, i) => (
                <div key={i} className="flex justify-between items-center group">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-charcoal group-hover:text-teal transition-colors">{p.product_name}</p>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{p.quantity} Units Sold</p>
                  </div>
                  <p className="text-sm font-bold text-charcoal">₹{(p.price_at_purchase * p.quantity).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
