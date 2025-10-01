'use client'

import { AdminProtection } from '@/components/AdminProtection'
import { Header } from '@/components/Header'
import { AdminOversight } from '@/components/AdminOversight'

export default function OversightPage() {
  return (
    <AdminProtection requiredRole="super_admin">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <Header />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Oversight</h1>
            <p className="text-gray-600 mt-2">Monitor admin activities and system usage</p>
          </div>

          <AdminOversight />
        </div>
      </div>
    </AdminProtection>
  )
}
