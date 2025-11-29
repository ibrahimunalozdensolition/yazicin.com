import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Not: Firebase Auth client-side çalıştığı için burada tam bir session kontrolü yapamıyoruz.
  // Cookie tabanlı session yönetimi eklenirse burada sunucu taraflı koruma yapılabilir.
  // Şu an için asıl koruma client-side ProtectedRoute bileşeni ile sağlanmaktadır.
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/customer/:path*',
    '/provider/:path*',
    '/profile/:path*',
  ],
}

