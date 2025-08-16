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
import { OTPVerification } from '@/components/auth/OTPVerification'
import { MockAuth } from '@/components/auth/MockAuth'
import { AuthButton } from '@coinbase/cdp-react/components/AuthButton'

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type EmailFormData = z.infer<typeof emailSchema>

export default function LoginPage() {
  const router = useRouter()
  const { 
    signInWithEmail, 
    isLoading, 
    error, 
    loginStep, 
    loginEmail, 
    setLoginStep, 
    setLoginEmail,
    isUsingCDP,
    isAuthenticated,
    user
  } = useAuth()

  console.log('LoginPage render - step:', loginStep, 'email:', loginEmail, 'isUsingCDP:', isUsingCDP, 'isAuthenticated:', isAuthenticated)

  // Detect when user becomes authenticated via CDP and redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && user && !isLoading) {
      console.log('LoginPage: User is authenticated, redirecting to dashboard')
      router.push('/')
    }
  }, [isAuthenticated, user, isLoading, router])

  // Store the email in localStorage when user enters it for the AuthButton
  // We'll use a MutationObserver to detect when email is entered in CDP AuthButton
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Create a MutationObserver to watch for email input changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Look for email input field in the CDP AuthButton component
          const emailInputs = document.querySelectorAll('input[type="email"], input[placeholder*="email" i]')
          emailInputs.forEach((input) => {
            if (input instanceof HTMLInputElement && !input.dataset.listenerAdded) {
              input.dataset.listenerAdded = 'true'
              input.addEventListener('change', (e) => {
                const email = (e.target as HTMLInputElement).value
                if (email && email.includes('@')) {
                  console.log('LoginPage: Storing email for header display:', email)
                  localStorage.setItem('cdp-login-email', email)
                }
              })
            }
          })
        }
      })
    })

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return () => observer.disconnect()
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError,
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    mode: 'onChange',
  })

  const onSubmitEmail = async (data: EmailFormData, event?: React.BaseSyntheticEvent) => {
    if (event) {
      event.preventDefault()
    }
    console.log('Form submitted with:', data)
    
    try {
      console.log('Calling signInWithEmail...')
      await signInWithEmail(data.email)
      console.log('signInWithEmail completed successfully')
      // Note: setLoginStep and setLoginEmail are now handled in the AuthProvider
    } catch (err) {
      console.error('Error in signInWithEmail:', err)
      setError('email', {
        message: err instanceof Error ? err.message : 'Failed to send OTP'
      })
    }
  }

  const handleOTPSuccess = () => {
    router.push('/')
  }

  const handleBackToEmail = () => {
    setLoginStep('email')
    setLoginEmail('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <MockAuth />
    
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
              Secure authentication powered by Coinbase Developer Platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Use the CDP AuthButton component like the working example */}
            <div className="w-full">
              <AuthButton />
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
              Protected by Coinbase Developer Platform
              {isUsingCDP && (
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  ✅ Using CDP React Provider
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