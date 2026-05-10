'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Search, Plus } from 'lucide-react'

interface User {
  id: string
  email: string
  full_name: string
  phone: string
  role: 'customer' | 'employee' | 'admin' | 'super_admin'
  is_active: boolean
  created_at: string
}

const ROLES = ['customer', 'employee', 'admin', 'super_admin']

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    phone: '',
    role: 'employee',
  })

  const pageSize = 20

  useEffect(() => {
    fetchUsers()
  }, [search, roleFilter, page])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        search,
        role: roleFilter === 'all' ? '' : roleFilter,
      })

      const res = await fetch(`/api/superadmin/users?${params}`)
      const data = await res.json()
      setUsers(data.users || [])
      setTotalCount(data.totalCount || 0)
    } catch (error) {
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleChangeRole = async (userId: string, newRole: string) => {
    // Optimistically update UI
    const prevUsers = users
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as User['role'] } : u))

    try {
      const res = await fetch(`/api/superadmin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (res.ok) {
        toast.success('Role updated successfully')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update role')
        setUsers(prevUsers) // revert on error
      }
    } catch (error) {
      toast.error('Error updating role')
      setUsers(prevUsers) // revert on error
    }
  }

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/superadmin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      })

      if (res.ok) {
        toast.success(isActive ? 'User suspended' : 'User activated')
        fetchUsers()
      } else {
        toast.error('Failed to update user status')
      }
    } catch (error) {
      toast.error('Error updating user')
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUser.email || !newUser.full_name) {
      toast.error('Email and name required')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/superadmin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      })

      if (res.ok) {
        toast.success('Admin user created')
        setNewUser({ email: '', full_name: '', phone: '', role: 'employee' })
        setShowCreateModal(false)
        fetchUsers()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to create user')
      }
    } catch (error) {
      toast.error('Error creating user')
    } finally {
      setCreating(false)
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-[#c9a84c] text-black font-bold px-4 py-2 rounded hover:bg-[#d4b66a]"
        >
          <Plus size={18} />
          Create Admin Account
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aab9e]" size={18} />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full bg-white border border-gray-300 rounded px-4 py-2 pl-10 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1C3829]"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value)
            setPage(1)
          }}
          className="bg-white border border-gray-300 rounded px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1C3829]"
        >
          <option value="all">All Roles</option>
          <option value="customer">Customer</option>
          <option value="employee">Employee</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-[#faf8f4] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-[#f5f2ec]">
            <tr>
              <th className="text-left px-6 py-3 text-[#5a7060] text-sm font-semibold">Name</th>
              <th className="text-left px-6 py-3 text-[#5a7060] text-sm font-semibold">Email</th>
              <th className="text-left px-6 py-3 text-[#5a7060] text-sm font-semibold">Phone</th>
              <th className="text-left px-6 py-3 text-[#5a7060] text-sm font-semibold">Role</th>
              <th className="text-left px-6 py-3 text-[#5a7060] text-sm font-semibold">Status</th>
              <th className="text-left px-6 py-3 text-[#5a7060] text-sm font-semibold">Joined</th>
              <th className="text-left px-6 py-3 text-[#5a7060] text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-[#5a7060]">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-[#5a7060]">
                  No users found
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="border-t border-[#f5f2ec] hover:bg-white/50 transition-colors">
                  <td className="px-6 py-4 text-gray-900">{user.full_name || '—'}</td>
                  <td className="px-6 py-4 text-[#5a7060] text-sm">{user.email}</td>
                  <td className="px-6 py-4 text-[#5a7060] text-sm">{user.phone || '—'}</td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleChangeRole(user.id, e.target.value)}
                      className="bg-white border border-gray-300 rounded px-2 py-1 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C3829]"
                    >
                      {ROLES.map(role => (
                        <option key={role} value={role}>
                          {role.replace('_', ' ').toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(user.id, user.is_active)}
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        user.is_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {user.is_active ? 'Active' : 'Suspended'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-[#5a7060] text-sm">
                    {new Date(user.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-6 py-4">
                    <a
                      href={`/admin/orders?customer=${user.id}`}
                      className="text-[#c9a84c] hover:underline text-sm"
                    >
                      View Orders
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-[#faf8f4] border border-[#f5f2ec] rounded text-white disabled:opacity-50 hover:bg-white"
          >
            Previous
          </button>
          <span className="flex items-center px-4 text-[#5a7060]">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-[#faf8f4] border border-[#f5f2ec] rounded text-white disabled:opacity-50 hover:bg-white"
          >
            Next
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#faf8f4] rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Admin Account</h2>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-[#4A4540] text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="admin@labelwink.co"
                  className="w-full bg-white border border-[#D4CFC7] rounded px-4 py-2 text-[#1A1816] placeholder-[#9E9891] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#4A4540] text-sm font-medium mb-2">Full Name *</label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full bg-white border border-[#D4CFC7] rounded px-4 py-2 text-[#1A1816] placeholder-[#9E9891] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#4A4540] text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  placeholder="9876543210"
                  className="w-full bg-white border border-[#D4CFC7] rounded px-4 py-2 text-[#1A1816] placeholder-[#9E9891] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                />
              </div>

              <div>
                <label className="block text-[#4A4540] text-sm font-medium mb-2">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full bg-white border border-[#D4CFC7] rounded px-4 py-2 text-[#1A1816] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-white border border-[#D4CFC7] text-[#4A4540] rounded hover:bg-[#f5f2ec] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-[#c9a84c] text-black font-bold rounded hover:bg-[#d4b66a] disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
