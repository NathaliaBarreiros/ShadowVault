import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePrivy, useLogout } from '@privy-io/react-auth';
import { useAccount, useDisconnect } from 'wagmi';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const { ready, authenticated, user, login } = usePrivy();
  const { logout } = useLogout();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    isLoading: true,
  });

  console.log('Chrome Extension AuthProvider - Privy status:', { 
    ready, 
    authenticated, 
    hasUser: !!user,
    userEmail: user?.email?.address,
    address,
    isConnected,
    authState 
  });

  // Update auth state based on Privy status
  useEffect(() => {
    if (!ready) {
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: true,
      });
      return;
    }

    if (authenticated && user) {
      setAuthState({
        isAuthenticated: true,
        user: {
          email: user.email?.address || '',
          id: user.id || '',
          address: address || ''
        },
        isLoading: false,
      });
    } else {
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
    }
  }, [ready, authenticated, user, address]);

  const signOut = async () => {
    try {
      await logout();
      if (isConnected) {
        disconnect();
      }
      console.log('Chrome Extension Privy signOut successful');
    } catch (error) {
      console.error('Error in signOut:', error);
      throw error;
    }
  };

  const contextValue = {
    ...authState,
    login,
    signOut,
    isUsingPrivy: ready, // Privy is available if ready
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider;