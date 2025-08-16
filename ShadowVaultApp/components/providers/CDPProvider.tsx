'use client'

import React from 'react'
import { type Config } from '@coinbase/cdp-hooks'
import { CDPReactProvider, type AppConfig } from '@coinbase/cdp-react/components/CDPReactProvider'

interface CDPProviderProps {
  children: React.ReactNode
}

export function CDPProvider({ children }: CDPProviderProps) {
  const projectId = process.env.NEXT_PUBLIC_CDP_PROJECT_ID

  console.log('CDPProvider - Project ID available:', !!projectId)

  // If no project ID is available, render children without CDP provider
  if (!projectId) {
    console.warn('CDP Project ID not found, CDP features will not be available')
    return <>{children}</>
  }

  try {
    // Use the same configuration approach as the working CDP example
    const CDP_CONFIG: Config = {
      projectId: projectId
    }

    const APP_CONFIG: AppConfig = {
      name: "ShadowVault",
      logoUrl: "/placeholder-logo.svg",
      authMethods: ["email"]
    }

    console.log('CDPProvider - Initializing with CDP React Provider:', { 
      projectId: !!CDP_CONFIG.projectId,
      appName: APP_CONFIG.name,
      authMethods: APP_CONFIG.authMethods
    })

    return (
      <CDPReactProvider config={CDP_CONFIG} app={APP_CONFIG}>
        {children}
      </CDPReactProvider>
    )
  } catch (error) {
    console.error('Failed to initialize CDP React Provider:', error)
    return <>{children}</>
  }
}