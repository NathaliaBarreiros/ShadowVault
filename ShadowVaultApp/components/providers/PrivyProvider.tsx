'use client'

import React from 'react'
import { PrivyProvider as BasePrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider } from '@privy-io/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createConfig, http } from 'wagmi'
import { defineChain } from 'viem'

interface PrivyProviderProps {
  children: React.ReactNode
}

const queryClient = new QueryClient()

// Zircuit Garfield Testnet configuration
const zircuitGarfieldTestnet = defineChain({
  id: 48898,
  name: 'Zircuit Garfield Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://garfield-testnet.zircuit.com'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Zircuit Garfield Explorer',
      url: 'https://explorer.garfield-testnet.zircuit.com',
    },
  },
  testnet: true,
})

const wagmiConfig = createConfig({
  chains: [zircuitGarfieldTestnet],
  transports: {
    [zircuitGarfieldTestnet.id]: http(),
  },
})

export function PrivyProvider({ children }: PrivyProviderProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

  console.log('PrivyProvider - App ID available:', !!appId)

  if (!appId) {
    console.warn('Privy App ID not found, authentication features will not be available')
    return <>{children}</>
  }

  try {
    return (
      <BasePrivyProvider
        appId={appId}
        config={{
          appearance: {
            theme: 'light',
            accentColor: '#676FFF',
            logo: '/placeholder-logo.svg',
          },
          embeddedWallets: {
            createOnLogin: 'users-without-wallets',
          },
          loginMethods: ['email', 'sms', 'wallet'],
          supportedChains: [zircuitGarfieldTestnet],
        }}
      >
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={wagmiConfig}>
            {children}
          </WagmiProvider>
        </QueryClientProvider>
      </BasePrivyProvider>
    )
  } catch (error) {
    console.error('Failed to initialize Privy Provider:', error)
    return <>{children}</>
  }
}