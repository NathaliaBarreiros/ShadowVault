'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { AuthState, authService } from '@/lib/auth'
import { 
  useIsInitialized,
  useIsSignedIn,
  useEvmAddress,
  useCurrentUser,
  useSignOut
} from '@coinbase/cdp-hooks'

interface AuthContextType extends AuthState {
  signInWithEmail: (email: string) => Promise<void>
  verifyOTP: (email: string, otp: string) => Promise<void>
  signOut: () => Promise<void>
  loginStep: 'email' | 'otp'
  loginEmail: string
  setLoginStep: (step: 'email' | 'otp') => void
  setLoginEmail: (email: string) => void
  isUsingCDP: boolean
  userLoginEmail: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Use the same approach as the working CDP example + get user email
  const { isInitialized } = useIsInitialized()
  const { isSignedIn } = useIsSignedIn()
  const { evmAddress } = useEvmAddress()
  const { currentUser: cdpUser } = useCurrentUser()
  const { signOut: cdpSignOut } = useSignOut()
  
  // Try multiple ways to get the email
  const email = cdpUser?.authenticationMethods?.email?.email || cdpUser?.email
  console.log('AuthProvider debug:', { 
    cdpUser, 
    evmAddress, 
    email,
    authMethods: cdpUser?.authenticationMethods,
    fullUser: cdpUser 
  })
  
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
  })
  
  // Login flow state for backward compatibility
  const [loginStep, setLoginStep] = useState<'email' | 'otp'>('email')
  const [loginEmail, setLoginEmail] = useState('')
  
  // Store the email used for login to display in header
  const [userLoginEmail, setUserLoginEmail] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('cdp-login-email') : null
  )

  // Listen for localStorage changes to update email
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = () => {
      const storedEmail = localStorage.getItem('cdp-login-email')
      setUserLoginEmail(storedEmail)
    }

    // Listen for storage events (from other tabs/windows)
    window.addEventListener('storage', handleStorageChange)
    
    // Also check periodically for changes in same tab
    const interval = setInterval(handleStorageChange, 1000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  console.log('AuthProvider render - CDP status:', { 
    isInitialized, 
    isSignedIn, 
    hasEvmAddress: !!evmAddress,
    evmAddress,
    hasUser: !!cdpUser,
    extractedEmail: email,
    userLoginEmail,
    authState 
  })

  // Update auth state based on CDP status (like the working example)
  useEffect(() => {
    if (!isInitialized) {
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: true,
      })
      return
    }

    if (isSignedIn && evmAddress) {
      const userEmail = cdpUser?.authenticationMethods?.email?.email || cdpUser?.email
      //const userEmail = email || userLoginEmail || 'cdp-user@coinbase.com'
      setAuthState({
        isAuthenticated: true,
        user: {
          email: userEmail,
          id: cdpUser?.userId || 'cdp_user',
          address: evmAddress
        },
        isLoading: false,
      })
    } else {
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      })
      // Clear stored email when signed out
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cdp-login-email')
        setUserLoginEmail(null)
      }
    }
  }, [isInitialized, isSignedIn, evmAddress, cdpUser, userLoginEmail])

  // Simplified functions for backward compatibility with our existing UI
  const signInWithEmail = async (email: string) => {
    console.log('AuthProvider.signInWithEmail - redirecting to CDP auth')
    setLoginEmail(email)
    setLoginStep('otp')
    // The actual sign-in will be handled by the CDP AuthButton component
  }

  const verifyOTP = async (email: string, otp: string) => {
    console.log('AuthProvider.verifyOTP - CDP handles this automatically')
    // CDP handles OTP verification automatically
  }

  const signOut = async () => {
    try {
      if (cdpSignOut) {
        await cdpSignOut()
        console.log('CDP signOut successful')
      }
      
      // Reset login flow state
      setLoginStep('email')
      setLoginEmail('')
    } catch (error) {
      console.error('Error in signOut:', error)
      throw error
    }
  }

  const contextValue: AuthContextType = {
    ...authState,
    signInWithEmail,
    verifyOTP,
    signOut,
    loginStep,
    loginEmail,
    setLoginStep,
    setLoginEmail,
    isUsingCDP: isInitialized, // CDP is available if initialized
    userLoginEmail,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}