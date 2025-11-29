"use client"

import ProtectedRoute from "@/components/auth/ProtectedRoute"

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute allowedRoles={["provider"]}>
      <div className="flex min-h-screen flex-col">
        {children}
      </div>
    </ProtectedRoute>
  )
}

