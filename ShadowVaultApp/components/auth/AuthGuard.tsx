'use client'

import React, { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { Loader2, Shield } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Don't do anything while still loading
    if (isLoading) {
      return
    }

    // If on login page and authenticated, redirect to dashboard
    if (pathname === '/login' && isAuthenticated) {
      console.log('AuthGuard: User is authenticated on login page, redirecting to dashboard')
      router.push('/')
      return
    }

    // If not on login page and not authenticated, redirect to login
    if (pathname !== '/login' && !isAuthenticated) {
      console.log('AuthGuard: User is not authenticated on protected page, redirecting to login')
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router, pathname])

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="p-3 bg-primary/10 rounded-full">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">ShadowVault</h1>
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading your secure vault...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Allow login page to render without authentication
  if (pathname === '/login') {
    return <>{children}</>
  }

  // Only render children if authenticated
  if (isAuthenticated) {
    return <>{children}</>
  }

  // Return null while redirecting
  return null
}