import React, { useState, useEffect } from 'react';
import './App.css';
import VaultHome from './components/VaultHome';
import VaultUnlock from './components/VaultUnlock';
import VaultAdd from './components/VaultAdd';
import VaultSettings from './components/VaultSettings';
import Analytics from './components/Analytics';
import Web3Integration from './components/Web3Integration';
import PrivyProvider from './providers/PrivyProvider';
import AuthProvider from './providers/AuthProvider';
import { getCurrentTab, updateActivity, isVaultLocked } from './chrome-api';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isLocked, setIsLocked] = useState(true);
  const [currentUrl, setCurrentUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [masterPassword, setMasterPassword] = useState('');

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Update activity timestamp
      await updateActivity();
      
      // Check if vault is locked
      const locked = await isVaultLocked();
      setIsLocked(locked);
      
      // Get current tab URL
      const tab = await getCurrentTab();
      if (tab) {
        setCurrentUrl(tab.url);
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = (password) => {
    setMasterPassword(password);
    setIsLocked(false);
    setActiveTab('home');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    updateActivity(); // Update activity on tab change
  };

  if (loading) {
    return (
      <div className="app-container loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading ShadowVault...</p>
        </div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="app-container">
        <VaultUnlock onUnlock={handleUnlock} />
      </div>
    );
  }

  const renderContent = () => {
    switch(activeTab) {
      case 'home':
        return <VaultHome currentUrl={currentUrl} onNavigate={handleTabChange} masterPassword={masterPassword} />;
      case 'add':
        return <VaultAdd currentUrl={currentUrl} onBack={() => handleTabChange('home')} masterPassword={masterPassword} />;
      case 'settings':
        return <VaultSettings onBack={() => handleTabChange('home')} masterPassword={masterPassword} />;
      case 'analytics':
        return <Analytics onBack={() => handleTabChange('home')} masterPassword={masterPassword} />;
      case 'web3':
        return <Web3Integration onBack={() => handleTabChange('home')} />;
      default:
        return <VaultHome currentUrl={currentUrl} onNavigate={handleTabChange} masterPassword={masterPassword} />;
    }
  };

  return (
    <PrivyProvider>
      <AuthProvider>
        <div className="app-container">
          {/* Header */}
          <header className="app-header">
            <div className="header-content">
              <div className="logo-section">
                <span className="logo-icon">🔒</span>
                <h1 className="app-title">ShadowVault</h1>
              </div>
              <div className="header-actions">
                {activeTab !== 'home' && (
                  <button 
                    className="back-button"
                    onClick={() => handleTabChange('home')}
                    title="Back to Home"
                  >
                    ←
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* Navigation */}
          {activeTab === 'home' && (
            <nav className="navigation">
              <div className="nav-content">
                <div className="nav-tabs">
                  <button 
                    className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`}
                    onClick={() => handleTabChange('home')}
                  >
                    <span className="nav-icon">🏠</span>
                    Home
                  </button>
                  <button 
                    className={`nav-tab ${activeTab === 'add' ? 'active' : ''}`}
                    onClick={() => handleTabChange('add')}
                  >
                    <span className="nav-icon">➕</span>
                    Add
                  </button>
                  <button 
                    className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
                    onClick={() => handleTabChange('analytics')}
                  >
                    <span className="nav-icon">📊</span>
                    Analytics
                  </button>
                  <button 
                    className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => handleTabChange('settings')}
                  >
                    <span className="nav-icon">⚙️</span>
                    Settings
                  </button>
                  <button 
                    className={`nav-tab ${activeTab === 'web3' ? 'active' : ''}`}
                    onClick={() => handleTabChange('web3')}
                  >
                    <span className="nav-icon">🌐</span>
                    Web3
                  </button>
                </div>
              </div>
            </nav>
          )}

          {/* Main Content */}
          <main className="main-content">
            {renderContent()}
          </main>

          {/* Footer */}
          <footer className="app-footer">
            <div className="footer-content">
              <div className="current-site">
                <span className="site-icon">🌐</span>
                <span className="site-url">{new URL(currentUrl || 'https://example.com').hostname}</span>
              </div>
              <div className="version">v1.0.0</div>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </PrivyProvider>
  );
}

export default App;