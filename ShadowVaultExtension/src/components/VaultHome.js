import React, { useState, useEffect } from 'react';
import { loadVault, lockVault as lockVaultStorage } from '../lib/storage';
import { getCurrentTab, fillCredentials, getPageForms } from '../chrome-api';

const VaultHome = ({ currentUrl, onNavigate, masterPassword }) => {
  const [vaultData, setVaultData] = useState({ entries: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pageInfo, setPageInfo] = useState({ forms: 0, hasWeb3: false });
  const [matchingEntries, setMatchingEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);

  useEffect(() => {
    loadVaultData();
    loadPageInfo();
  }, [currentUrl]);

  const loadVaultData = async () => {
    try {
      if (!masterPassword) {
        setError('Master password is required');
        setLoading(false);
        return;
      }

      const data = await loadVault(masterPassword);
      setVaultData(data);
      
      // Find matching entries for current site
      if (currentUrl) {
        const hostname = new URL(currentUrl).hostname;
        const matches = (data.entries || []).filter(entry => 
          entry.url && entry.url.includes(hostname)
        );
        setMatchingEntries(matches);
      }
    } catch (error) {
      console.error('Error loading vault data:', error);
      if (error.message.includes('incorrect password') || error.message.includes('Failed to decrypt')) {
        setError('Authentication failed. Please unlock vault again.');
      } else {
        setError('Failed to load vault data');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPageInfo = async () => {
    try {
      const info = await getPageForms();
      setPageInfo(info);
    } catch (error) {
      console.error('Error loading page info:', error);
    }
  };

  const handleAutoFill = async (entry) => {
    try {
      await fillCredentials({
        username: entry.username,
        password: entry.password
      });
      
      // Show success notification
      setSelectedEntry(entry);
      setTimeout(() => setSelectedEntry(null), 2000);
    } catch (error) {
      console.error('Error auto-filling credentials:', error);
    }
  };

  const handleLockVault = async () => {
    try {
      await lockVaultStorage();
      window.location.reload(); // Refresh to show unlock screen
    } catch (error) {
      console.error('Error locking vault:', error);
    }
  };

  const getCurrentSite = () => {
    if (!currentUrl) return 'Unknown';
    try {
      return new URL(currentUrl).hostname;
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="content-section">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-section">
      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🔑</div>
          <div className="stat-content">
            <div className="stat-number">{vaultData.entries.length}</div>
            <div className="stat-label">Stored Passwords</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🌐</div>
          <div className="stat-content">
            <div className="stat-number">{matchingEntries.length}</div>
            <div className="stat-label">For This Site</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🛡️</div>
          <div className="stat-content">
            <div className="stat-number">{pageInfo.forms}</div>
            <div className="stat-label">Forms Detected</div>
          </div>
        </div>
      </div>

      {/* Current Site Section */}
      <div className="section">
        <h2 className="section-title">
          <span>🌍</span>
          Current Site: {getCurrentSite()}
        </h2>
        
        {pageInfo.hasWeb3 && (
          <div className="web3-indicator">
            <span className="web3-icon">🦊</span>
            <span>Web3 provider detected - Enhanced security active</span>
          </div>
        )}

        {matchingEntries.length > 0 ? (
          <div className="matching-entries">
            <p className="section-description">
              Found {matchingEntries.length} saved credential(s) for this site:
            </p>
            {matchingEntries.map((entry, index) => (
              <div key={index} className="credential-card">
                <div className="credential-info">
                  <div className="credential-title">{entry.title || entry.url}</div>
                  <div className="credential-username">{entry.username}</div>
                  <div className="credential-meta">
                    Saved {new Date(entry.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="credential-actions">
                  <button
                    onClick={() => handleAutoFill(entry)}
                    className="button auto-fill-button"
                    disabled={!pageInfo.forms}
                  >
                    <span>🔑</span>
                    Auto-Fill
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-matches">
            <div className="empty-state-icon">🔍</div>
            <p>No saved credentials for this site</p>
            <button
              onClick={() => onNavigate('add')}
              className="button"
            >
              <span>➕</span>
              Add New Entry
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="section">
        <h2 className="section-title">
          <span>⚡</span>
          Quick Actions
        </h2>
        <div className="action-grid">
          <button
            onClick={() => onNavigate('add')}
            className="action-button"
          >
            <div className="action-icon">➕</div>
            <div className="action-text">
              <div className="action-title">Add Entry</div>
              <div className="action-subtitle">Save new credentials</div>
            </div>
          </button>
          
          <button
            onClick={() => onNavigate('analytics')}
            className="action-button"
          >
            <div className="action-icon">📊</div>
            <div className="action-text">
              <div className="action-title">Analytics</div>
              <div className="action-subtitle">View usage stats</div>
            </div>
          </button>
          
          <button
            onClick={() => onNavigate('settings')}
            className="action-button"
          >
            <div className="action-icon">⚙️</div>
            <div className="action-text">
              <div className="action-title">Settings</div>
              <div className="action-subtitle">Configure vault</div>
            </div>
          </button>
          
          <button
            onClick={handleLockVault}
            className="action-button lock-button"
          >
            <div className="action-icon">🔒</div>
            <div className="action-text">
              <div className="action-title">Lock Vault</div>
              <div className="action-subtitle">Secure your data</div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      {vaultData.entries.length > 0 && (
        <div className="section">
          <h2 className="section-title">
            <span>📋</span>
            Recent Entries
          </h2>
          <div className="recent-entries">
            {vaultData.entries.slice(0, 3).map((entry, index) => (
              <div key={index} className="recent-entry">
                <div className="entry-icon">🔑</div>
                <div className="entry-info">
                  <div className="entry-title">{entry.title || 'Untitled'}</div>
                  <div className="entry-url">{entry.url || 'No URL'}</div>
                </div>
                <div className="entry-date">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success notification */}
      {selectedEntry && (
        <div className="success-notification">
          <span className="success-icon">✅</span>
          <span>Credentials auto-filled successfully!</span>
        </div>
      )}

      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px 12px;
          border-radius: 12px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .stat-icon {
          font-size: 24px;
        }

        .stat-content {
          text-align: center;
        }

        .stat-number {
          font-size: 20px;
          font-weight: 700;
          line-height: 1;
        }

        .stat-label {
          font-size: 11px;
          opacity: 0.9;
          line-height: 1.2;
        }

        .section {
          margin-bottom: 24px;
        }

        .web3-indicator {
          background: #e8f5e8;
          color: #2d5a2d;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 16px;
        }

        .web3-icon {
          font-size: 16px;
        }

        .matching-entries {
          margin-top: 12px;
        }

        .credential-card {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .credential-info {
          flex: 1;
        }

        .credential-title {
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
        }

        .credential-username {
          color: #666;
          font-size: 14px;
          margin-bottom: 2px;
        }

        .credential-meta {
          color: #999;
          font-size: 12px;
        }

        .credential-actions {
          margin-left: 12px;
        }

        .auto-fill-button {
          font-size: 13px;
          padding: 8px 16px;
        }

        .no-matches {
          text-align: center;
          padding: 32px 16px;
          color: #666;
        }

        .no-matches .empty-state-icon {
          font-size: 48px;
          margin-bottom: 12px;
          opacity: 0.5;
        }

        .no-matches p {
          margin-bottom: 16px;
        }

        .action-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .action-button {
          background: white;
          border: 1px solid #e9ecef;
          padding: 16px 12px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .action-button:hover {
          border-color: #667eea;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
        }

        .action-button.lock-button:hover {
          border-color: #e74c3c;
          box-shadow: 0 2px 8px rgba(231, 76, 60, 0.1);
        }

        .action-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .action-text {
          flex: 1;
        }

        .action-title {
          font-weight: 600;
          color: #333;
          font-size: 14px;
          margin-bottom: 2px;
        }

        .action-subtitle {
          color: #666;
          font-size: 12px;
        }

        .recent-entries {
          margin-top: 12px;
        }

        .recent-entry {
          display: flex;
          align-items: center;
          padding: 12px;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          margin-bottom: 8px;
          gap: 12px;
        }

        .entry-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .entry-info {
          flex: 1;
          min-width: 0;
        }

        .entry-title {
          font-weight: 500;
          color: #333;
          font-size: 14px;
          margin-bottom: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .entry-url {
          color: #666;
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .entry-date {
          color: #999;
          font-size: 11px;
          flex-shrink: 0;
        }

        .success-notification {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #d4edda;
          color: #155724;
          padding: 12px 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          z-index: 1000;
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        .loading-state {
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }

        .loading-state .spinner {
          width: 32px;
          height: 32px;
          margin: 0 auto 16px auto;
        }
      `}</style>
    </div>
  );
};

export default VaultHome;