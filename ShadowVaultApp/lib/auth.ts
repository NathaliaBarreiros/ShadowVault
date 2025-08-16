// Legacy auth utilities - most functionality moved to AuthProvider with Privy

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

// Email validation utility
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Auth error types
export enum AuthErrorType {
  INVALID_EMAIL = 'INVALID_EMAIL',
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