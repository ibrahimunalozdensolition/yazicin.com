"use client"

import ProtectedRoute from "@/components/auth/ProtectedRoute"

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute allowedRoles={["customer"]}>
      <div className="flex min-h-screen flex-col">
        {children}
      </div>
    </ProtectedRoute>
  )
}

