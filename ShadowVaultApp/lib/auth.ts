import { initialize, signInWithEmail as cdpSignInWithEmail, verifyEmailOTP as cdpVerifyEmailOTP, signOut as cdpSignOut, getCurrentUser as cdpGetCurrentUser, isSignedIn as cdpIsSignedIn } from '@coinbase/cdp-core'

export interface AuthState {
  isAuthenticated: boolean
  user: {
    email?: string
    address?: string
    id?: string
  } | null
  isLoading: boolean
  error?: string
}

export interface AuthConfig {
  projectId: string
  apiKey: string
}

// Auth configuration - will be loaded from environment variables
export const authConfig: AuthConfig = {
  projectId: process.env.NEXT_PUBLIC_CDP_PROJECT_ID || '',
  apiKey: process.env.NEXT_PUBLIC_CDP_API_KEY || '',
}

// Debug logging
if (typeof window !== 'undefined') {
  console.log('Auth config debug:', {
    projectId: authConfig.projectId,
    hasProjectId: !!authConfig.projectId,
    projectIdLength: authConfig.projectId.length,
    env: process.env.NEXT_PUBLIC_CDP_PROJECT_ID
  })
}

// Initialize CDP
let useMockAuth = false

export const initializeCDP = async () => {
  try {
    // Check if we have valid configuration
    if (!authConfig.projectId) {
      console.warn('CDP Project ID not found, falling back to mock auth')
      useMockAuth = true
      return
    }

    console.log('Initializing CDP with project ID:', authConfig.projectId)
    
    // Initialize CDP core
    await initialize({
      projectId: authConfig.projectId,
      // Add any other required configuration
    })
    
    console.log('CDP initialized successfully')
    useMockAuth = false
  } catch (error) {
    console.error('Failed to initialize CDP, falling back to mock auth:', error)
    useMockAuth = true
  }
}

// Email validation utility
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Auth error types
export enum AuthErrorType {
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_OTP = 'INVALID_OTP',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class AuthError extends Error {
  constructor(
    public type: AuthErrorType,
    message: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

// CDP-based auth service
export class AuthService {
  private static instance: AuthService

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async signInWithEmail(email: string): Promise<{ success: boolean; message: string }> {
    console.log('AuthService.signInWithEmail called with:', email)
    
    try {
      // Validate email
      if (!validateEmail(email)) {
        throw new AuthError(AuthErrorType.INVALID_EMAIL, 'Invalid email address')
      }

      // Initialize CDP if needed
      await initializeCDP()
      console.log('CDP initialized, useMockAuth:', useMockAuth)

      if (useMockAuth) {
        // Mock implementation for demo
        console.log('Using mock auth, simulating delay...')
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log('Mock auth completed successfully')
        return {
          success: true,
          message: 'OTP sent to your email address (Demo mode - use any 6-digit code)'
        }
      }

      // Use CDP signInWithEmail function
      console.log('Calling CDP signInWithEmail...')
      const result = await cdpSignInWithEmail({ email })
      console.log('CDP signInWithEmail result:', result)

      return {
        success: true,
        message: 'OTP sent to your email address'
      }
    } catch (error) {
      console.error('Error in AuthService.signInWithEmail:', error)
      if (error instanceof AuthError) {
        throw error
      }
      throw new AuthError(AuthErrorType.NETWORK_ERROR, 'Failed to send OTP')
    }
  }

  async verifyOTP(email: string, otp: string): Promise<{ user: AuthState['user']; token: string }> {
    try {
      // Validate OTP format
      if (!/^\d{6}$/.test(otp)) {
        throw new AuthError(AuthErrorType.INVALID_OTP, 'Invalid OTP format')
      }

      if (useMockAuth) {
        // Mock implementation for demo
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        const user = {
          email,
          id: `demo_user_${Date.now()}`,
          address: '0x' + Math.random().toString(16).substring(2, 42),
        }

        const token = `demo_token_${Date.now()}`
        return { user, token }
      }

      // Use CDP verifyEmailOTP function - Note: This won't work without flowId from hooks
      // This is just a fallback and should not be reached when using the AuthProvider
      console.log('Calling CDP verifyEmailOTP (fallback mode)...')
      throw new Error('CDP verifyEmailOTP requires flowId from hooks - use AuthProvider instead')
    } catch (error) {
      if (error instanceof AuthError) {
        throw error
      }
      throw new AuthError(AuthErrorType.INVALID_OTP, 'Invalid OTP code')
    }
  }

  async signOut(): Promise<void> {
    try {
      if (!useMockAuth) {
        await cdpSignOut()
      }
    } catch (error) {
      console.error('Failed to sign out:', error)
    }
    
    // Clear any stored tokens/session data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
    }
  }

  async getCurrentUser(): Promise<AuthState['user']> {
    if (useMockAuth) {
      // Return stored user from localStorage for mock auth
      if (typeof window !== 'undefined') {
        try {
          const userData = localStorage.getItem('user_data')
          return userData ? JSON.parse(userData) : null
        } catch (error) {
          return null
        }
      }
      return null
    }

    try {
      const user = await cdpGetCurrentUser()
      return user ? {
        email: (user as any).email || '',
        id: (user as any).id || '',
        address: (user as any).address || '',
      } : null
    } catch (error) {
      return null
    }
  }

  async isUserAuthenticated(): Promise<boolean> {
    if (useMockAuth) {
      // Check localStorage for mock auth
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token')
        return !!token
      }
      return false
    }

    try {
      return await cdpIsSignedIn()
    } catch (error) {
      return false
    }
  }

  // Initialize auth state from CDP
  async initializeFromStorage(): Promise<AuthState> {
    try {
      await initializeCDP()
      
      const authenticated = await this.isUserAuthenticated()
      if (authenticated) {
        const user = await this.getCurrentUser()
        return {
          isAuthenticated: true,
          user,
          isLoading: false,
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth from CDP:', error)
    }

    return {
      isAuthenticated: false,
      user: null,
      isLoading: false,
    }
  }

  // Store auth state
  storeAuthState(user: AuthState['user'], token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('user_data', JSON.stringify(user))
    }
  }
}

export const authService = AuthService.getInstance()