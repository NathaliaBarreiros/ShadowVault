'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/components/providers/AuthProvider'

export function MockAuth() {
  const [step, setStep] = useState<'info' | 'hidden'>('info')
  const { isUsingCDP } = useAuth()

  if (step === 'hidden') return null

  // Only show the modal if we're NOT using real CDP
  if (isUsingCDP) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-center">🚧 Demo Mode</CardTitle>
          <CardDescription className="text-center">
            CDP authentication is running in demo mode. For testing purposes, any email and 6-digit code will work.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm">
              <strong>How to test:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Enter any valid email address</li>
                <li>Enter any 6-digit code (e.g., 123456)</li>
                <li>You'll be logged into the dashboard</li>
              </ol>
            </div>
            <Button 
              onClick={() => setStep('hidden')} 
              className="w-full"
            >
              Got it, continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}