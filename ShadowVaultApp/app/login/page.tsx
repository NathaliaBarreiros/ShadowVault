'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Shield, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type EmailFormData = z.infer<typeof emailSchema>

export default function LoginPage() {
  const router = useRouter()
  const { 
    login, 
    isLoading, 
    error, 
    isUsingPrivy,
    isAuthenticated,
    user
  } = useAuth()

  console.log('LoginPage render - isUsingPrivy:', isUsingPrivy, 'isAuthenticated:', isAuthenticated)

  // Detect when user becomes authenticated and redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && user && !isLoading) {
      console.log('LoginPage: User is authenticated, redirecting to dashboard')
      router.push('/')
    }
  }, [isAuthenticated, user, isLoading, router])

  const handleLogin = () => {
    login()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
    
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">ShadowVault</h1>
          </div>
          <p className="text-muted-foreground">
            Secure your passwords across multiple chains
          </p>
        </div>

        {/* Login Form */}
        <Card className="border-2">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign in to your vault</CardTitle>
            <CardDescription>
              Secure authentication powered by Privy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Privy Login Button */}
            <div className="w-full">
              <Button 
                onClick={handleLogin} 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Sign in with Privy
                  </>
                )}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Secure Authentication
                </span>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Protected by Privy Authentication
              {isUsingPrivy && (
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  ✅ Using Privy Provider
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Features */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="space-y-2">
            <div className="h-8 w-8 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-xs">
              <div className="font-medium">Encrypted Storage</div>
              <div className="text-muted-foreground">End-to-end encryption</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-8 w-8 mx-auto bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-xs">
              <div className="font-medium">Email Verification</div>
              <div className="text-muted-foreground">Secure OTP delivery</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our{' '}
          <a href="#" className="underline hover:text-foreground">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="underline hover:text-foreground">
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  )
}