'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Loader2, Mail, Shield, RefreshCw } from 'lucide-react'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { useAuth } from '@/components/providers/AuthProvider'

interface OTPVerificationProps {
  email: string
  onSuccess: () => void
  onBack: () => void
}

export function OTPVerification({ email, onSuccess, onBack }: OTPVerificationProps) {
  const [otp, setOtp] = useState('')
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const { verifyOTP, signInWithEmail, isLoading, error } = useAuth()

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [countdown])

  const handleOTPComplete = async (value: string) => {
    setOtp(value)
    if (value.length === 6) {
      try {
        await verifyOTP(email, value)
        onSuccess()
      } catch (err) {
        // Error handling is done in the auth provider
        setOtp('')
      }
    }
  }

  const handleResendOTP = async () => {
    try {
      await signInWithEmail(email)
      setCountdown(60)
      setCanResend(false)
      setOtp('')
    } catch (err) {
      // Error will be shown from auth provider
    }
  }

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3')

  return (
    <Card className="border-2">
      <CardHeader className="space-y-1">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle className="text-xl">Verify your email</CardTitle>
            <CardDescription>
              Enter the 6-digit code sent to {maskedEmail}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* OTP Input */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={handleOTPComplete}
              disabled={isLoading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verifying code...</span>
            </div>
          )}
        </div>

        {/* Resend Section */}
        <div className="text-center space-y-3">
          <div className="text-sm text-muted-foreground">
            Didn't receive the code?
          </div>
          
          {canResend ? (
            <Button
              variant="outline"
              onClick={handleResendOTP}
              disabled={isLoading}
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Resend verification code
            </Button>
          ) : (
            <div className="text-sm text-muted-foreground">
              Resend available in {countdown}s
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center space-x-2 text-sm font-medium">
            <Mail className="h-4 w-4 text-blue-600" />
            <span>Check your email</span>
          </div>
          <div className="text-sm text-muted-foreground">
            The verification code was sent to your email address. If you don't see it in your inbox, check your spam folder.
          </div>
        </div>

        {/* Security Note */}
        <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
          <Shield className="h-3 w-3" />
          <span>Secured by Coinbase Developer Platform</span>
        </div>
      </CardContent>
    </Card>
  )
}