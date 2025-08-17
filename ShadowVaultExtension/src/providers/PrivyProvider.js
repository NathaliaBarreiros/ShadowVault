import React from 'react';
import { PrivyProvider as BasePrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';

const queryClient = new QueryClient();

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
});

const wagmiConfig = createConfig({
  chains: [zircuitGarfieldTestnet],
  transports: {
    [zircuitGarfieldTestnet.id]: http(),
  },
});

export function PrivyProvider({ children }) {
  // For Chrome extension, we'll use a demo App ID or environment variable
  const appId = process.env.REACT_APP_PRIVY_APP_ID || 'cm4ljhqoh09kx13p9ub68i5ef';

  console.log('Chrome Extension PrivyProvider - App ID available:', !!appId);

  if (!appId) {
    console.warn('Privy App ID not found, authentication features will not be available');
    return <>{children}</>;
  }

  try {
    return (
      <BasePrivyProvider
        appId={appId}
        config={{
          appearance: {
            theme: 'light',
            accentColor: '#667eea',
            logo: undefined, // Chrome extension doesn't need logo
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
    );
  } catch (error) {
    console.error('Failed to initialize Privy Provider:', error);
    return <>{children}</>;
  }
}

export default PrivyProvider;