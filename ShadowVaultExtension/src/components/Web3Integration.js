/* global chrome */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { addTransactionLog } from '../lib/storage';

const Web3Integration = ({ onBack }) => {
  const { isAuthenticated, user, login, signOut } = useAuth();
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    loadRecentTransactions();
  }, []);

  const loadRecentTransactions = async () => {
    try {
      // Get transaction logs from storage
      const logs = await chrome.storage.local.get('transactionLogs');
      const transactionLogs = logs.transactionLogs || [];
      
      // Filter Web3 related transactions
      const web3Transactions = transactionLogs.filter(log => 
        log.transaction?.activityType || log.type?.includes('web3')
      );
      
      setTransactions(web3Transactions.slice(0, 10)); // Show last 10
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handlePrivyLogin = async () => {
    try {
      setLoading(true);
      setError('');
      login();
    } catch (error) {
      console.error('Error logging in with Privy:', error);
      setError('Failed to connect with Privy');
    } finally {
      setLoading(false);
    }
  };

  const handleWalletConnect = async (connector) => {
    try {
      setLoading(true);
      setError('');
      connect({ connector });
      
      // Log wallet connection
      await addTransactionLog({
        type: 'wallet_connected',
        action: 'Connected external wallet',
        metadata: {
          connectorName: connector.name,
          connectorType: connector.type
        }
      });
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      if (isAuthenticated) {
        await signOut();
      }
      if (isConnected) {
        disconnect();
      }
      
      // Log disconnection
      await addTransactionLog({
        type: 'wallet_disconnected',
        action: 'Disconnected Web3 wallet',
        metadata: {
          address: address,
          chainId: chainId
        }
      });
      
    } catch (error) {
      console.error('Error disconnecting:', error);
      setError('Failed to disconnect');
    } finally {
      setLoading(false);
    }
  };

  const getChainName = (chainId) => {
    switch (chainId) {
      case 48898: return 'Zircuit Garfield Testnet';
      case 1: return 'Ethereum Mainnet';
      case 11155111: return 'Sepolia Testnet';
      default: return `Chain ${chainId}`;
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="content-section">
      <h1 className="section-title">
        <span>🌐</span>
        Web3 Integration
      </h1>
      <p className="section-description">
        Connect with Privy authentication and Web3 wallets
      </p>

      {/* Connection Status */}
      <div className="connection-status">
        <div className="status-card">
          <div className="status-header">
            <h3>Privy Authentication</h3>
            <span className={`status-badge ${isAuthenticated ? 'connected' : 'disconnected'}`}>
              {isAuthenticated ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
          </div>
          {isAuthenticated && user && (
            <div className="user-info">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>User ID:</strong> {user.id}</p>
            </div>
          )}
        </div>

        <div className="status-card">
          <div className="status-header">
            <h3>Wallet Connection</h3>
            <span className={`status-badge ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
          </div>
          {isConnected && (
            <div className="wallet-info">
              <p><strong>Address:</strong> {formatAddress(address)}</p>
              <p><strong>Network:</strong> {getChainName(chainId)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Connection Actions */}
      <div className="connection-actions">
        {!isAuthenticated ? (
          <button
            onClick={handlePrivyLogin}
            className="button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Connecting...
              </>
            ) : (
              <>
                <span>🔐</span>
                Connect with Privy
              </>
            )}
          </button>
        ) : (
          <div className="connected-actions">
            <button onClick={handleDisconnect} className="button secondary" disabled={loading}>
              <span>🔓</span>
              Disconnect
            </button>
          </div>
        )}

        {/* Wallet Connectors */}
        {!isConnected && (
          <div className="wallet-connectors">
            <h3>Connect External Wallet</h3>
            <div className="connector-grid">
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => handleWalletConnect(connector)}
                  className="connector-button"
                  disabled={loading}
                >
                  <span>💼</span>
                  {connector.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <div className="recent-transactions">
          <h3>Recent Web3 Activity</h3>
          <div className="transaction-list">
            {transactions.map((tx, index) => (
              <div key={index} className="transaction-item">
                <div className="transaction-icon">
                  {tx.type?.includes('connected') ? '🔗' : 
                   tx.type?.includes('disconnected') ? '🔓' : 
                   tx.transaction?.activityType === 'sensitiveOperation' ? '⚠️' : '📝'}
                </div>
                <div className="transaction-details">
                  <div className="transaction-action">{tx.action}</div>
                  <div className="transaction-time">
                    {new Date(tx.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="form-actions">
        <button onClick={onBack} className="button secondary">
          <span>🏠</span>
          Back to Home
        </button>
      </div>

      <style jsx>{`
        .connection-status {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }

        .status-card {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 16px;
          border: 1px solid #e9ecef;
        }

        .status-header {
          display: flex;
          justify-content: between;
          align-items: center;
          margin-bottom: 12px;
        }

        .status-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-badge.connected {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.disconnected {
          background: #f8d7da;
          color: #721c24;
        }

        .user-info, .wallet-info {
          font-size: 14px;
          color: #666;
        }

        .user-info p, .wallet-info p {
          margin: 4px 0;
        }

        .connection-actions {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }

        .connected-actions {
          display: flex;
          gap: 12px;
        }

        .wallet-connectors h3 {
          font-size: 16px;
          margin-bottom: 12px;
        }

        .connector-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }

        .connector-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border: 1px solid #e9ecef;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .connector-button:hover {
          background: #f8f9fa;
          border-color: #667eea;
        }

        .recent-transactions {
          margin-top: 24px;
        }

        .recent-transactions h3 {
          font-size: 16px;
          margin-bottom: 12px;
        }

        .transaction-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .transaction-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .transaction-icon {
          font-size: 20px;
        }

        .transaction-details {
          flex: 1;
        }

        .transaction-action {
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }

        .transaction-time {
          font-size: 12px;
          color: #666;
          margin-top: 2px;
        }

        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .spinner-small {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .form-actions {
          margin-top: 24px;
        }
      `}</style>
    </div>
  );
};

export default Web3Integration;