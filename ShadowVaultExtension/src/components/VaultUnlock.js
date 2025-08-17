import React, { useState, useEffect } from 'react';
import { isVaultSetup, loadVault, unlockVault } from '../lib/storage';
import { setStorageData } from '../chrome-api';

const VaultUnlock = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(false);

  // Check if vault is already set up
  useEffect(() => {
    const checkVaultSetup = async () => {
      try {
        const setup = await isVaultSetup();
        setIsFirstTime(!setup);
      } catch (error) {
        console.error('Error checking vault setup:', error);
        setIsFirstTime(true);
      }
    };
    
    checkVaultSetup();
  }, []);

  const handleUnlock = async (e) => {
    e.preventDefault();
    
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isFirstTime) {
        // First time setup - redirect to setup flow
        setError('Please complete the initial setup first');
        return;
      }

      // Try to load and decrypt the vault with the provided password
      await loadVault(password);
      
      // If successful, unlock the vault
      await unlockVault();
      
      // Call the parent unlock handler with the password
      onUnlock(password);
      
    } catch (error) {
      console.error('Error unlocking vault:', error);
      if (error.message.includes('incorrect password') || error.message.includes('Failed to decrypt')) {
        setError('Incorrect master password');
      } else {
        setError('Failed to unlock vault');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoUnlock = async () => {
    setPassword('demo');
    setTimeout(() => {
      handleUnlock({ preventDefault: () => {} });
    }, 100);
  };

  return (
    <div className="content-section">
      <div className="unlock-container">
        {/* Logo and Title */}
        <div className="unlock-header">
          <div className="unlock-logo">
            <span className="logo-icon">🔒</span>
          </div>
          <h1 className="unlock-title">ShadowVault</h1>
          <p className="unlock-subtitle">Secure Password Manager</p>
        </div>

        {/* Unlock Form */}
        <form onSubmit={handleUnlock} className="unlock-form">
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Master Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Enter your master password"
              autoFocus
            />
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="button unlock-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Unlocking...
              </>
            ) : (
              <>
                <span>🔓</span>
                Unlock Vault
              </>
            )}
          </button>
        </form>

        {/* Demo Mode */}
        <div className="demo-section">
          <div className="demo-divider">
            <span>or</span>
          </div>
          <button
            onClick={handleDemoUnlock}
            className="button secondary demo-button"
            disabled={loading}
          >
            <span>🚀</span>
            Try Demo Mode
          </button>
          <p className="demo-note">
            Demo mode uses 'demo' as the password for testing
          </p>
        </div>

        {/* Security Info */}
        <div className="security-info">
          <div className="security-feature">
            <span className="feature-icon">🛡️</span>
            <span>256-bit AES encryption</span>
          </div>
          <div className="security-feature">
            <span className="feature-icon">🔐</span>
            <span>Zero-knowledge architecture</span>
          </div>
          <div className="security-feature">
            <span className="feature-icon">🌐</span>
            <span>Web3 integration</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .unlock-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 500px;
          padding: 40px 20px;
        }

        .unlock-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .unlock-logo {
          margin-bottom: 16px;
        }

        .unlock-logo .logo-icon {
          font-size: 64px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .unlock-title {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .unlock-subtitle {
          color: #666;
          font-size: 16px;
          margin: 0;
        }

        .unlock-form {
          width: 100%;
          max-width: 280px;
          margin-bottom: 30px;
        }

        .unlock-button {
          width: 100%;
          font-size: 16px;
          padding: 16px;
          margin-top: 8px;
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

        .demo-section {
          text-align: center;
          width: 100%;
          max-width: 280px;
          margin-bottom: 30px;
        }

        .demo-divider {
          position: relative;
          margin: 20px 0;
          color: #999;
          font-size: 14px;
        }

        .demo-divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #e9ecef;
          z-index: 1;
        }

        .demo-divider span {
          background: white;
          padding: 0 12px;
          position: relative;
          z-index: 2;
        }

        .demo-button {
          width: 100%;
          font-size: 16px;
          padding: 16px;
          margin-bottom: 8px;
        }

        .demo-note {
          font-size: 12px;
          color: #999;
          margin: 0;
          font-style: italic;
        }

        .security-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
          max-width: 280px;
        }

        .security-feature {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #666;
          justify-content: center;
        }

        .feature-icon {
          font-size: 16px;
        }
      `}</style>
    </div>
  );
};

export default VaultUnlock;