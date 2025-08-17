import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings, getVaultData, clearTransactionLogs } from '../chrome-api';

const VaultSettings = ({ onBack }) => {
  const [settings, setSettings] = useState({
    autoLock: true,
    lockTimeout: 15,
    biometric: false,
    darkMode: true,
    notifications: true
  });
  const [vaultStats, setVaultStats] = useState({
    totalEntries: 0,
    lastBackup: null
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadSettings();
    loadVaultStats();
  }, []);

  const loadSettings = async () => {
    try {
      const currentSettings = await getSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadVaultStats = async () => {
    try {
      const { data } = await getVaultData();
      setVaultStats({
        totalEntries: data.entries?.length || 0,
        lastBackup: data.lastSync || null
      });
    } catch (error) {
      console.error('Error loading vault stats:', error);
    }
  };

  const handleSettingChange = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    try {
      await saveSettings(newSettings);
      showMessage('success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      showMessage('error', 'Failed to save settings');
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all transaction logs?')) {
      return;
    }

    setLoading(true);
    try {
      await clearTransactionLogs();
      showMessage('success', 'Transaction logs cleared');
    } catch (error) {
      console.error('Error clearing logs:', error);
      showMessage('error', 'Failed to clear logs');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const { data } = await getVaultData();
      
      // Create exportable data (without sensitive info for demo)
      const exportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        entriesCount: data.entries?.length || 0,
        settings: settings
      };
      
      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shadowvault-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showMessage('success', 'Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      showMessage('error', 'Failed to export data');
    }
  };

  return (
    <div className="content-section">
      <h1 className="section-title">
        <span>⚙️</span>
        Settings
      </h1>
      <p className="section-description">
        Configure your ShadowVault preferences and security settings
      </p>

      {/* Message Display */}
      {message.text && (
        <div className={`message ${message.type}`}>
          <span className="message-icon">
            {message.type === 'success' ? '✅' : '⚠️'}
          </span>
          {message.text}
        </div>
      )}

      {/* Security Settings */}
      <div className="settings-section">
        <h2 className="settings-section-title">
          <span>🔒</span>
          Security
        </h2>
        
        <div className="setting-item">
          <div className="setting-info">
            <div className="setting-title">Auto-lock vault</div>
            <div className="setting-description">
              Automatically lock the vault after a period of inactivity
            </div>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.autoLock}
              onChange={(e) => handleSettingChange('autoLock', e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>

        {settings.autoLock && (
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-title">Lock timeout</div>
              <div className="setting-description">
                Time before auto-lock (in minutes)
              </div>
            </div>
            <select
              value={settings.lockTimeout}
              onChange={(e) => handleSettingChange('lockTimeout', parseInt(e.target.value))}
              className="setting-select"
            >
              <option value={5}>5 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
            </select>
          </div>
        )}

        <div className="setting-item">
          <div className="setting-info">
            <div className="setting-title">Biometric unlock</div>
            <div className="setting-description">
              Use fingerprint or face recognition (when available)
            </div>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.biometric}
              onChange={(e) => handleSettingChange('biometric', e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="settings-section">
        <h2 className="settings-section-title">
          <span>🎨</span>
          Appearance
        </h2>
        
        <div className="setting-item">
          <div className="setting-info">
            <div className="setting-title">Dark mode</div>
            <div className="setting-description">
              Use dark theme for the interface
            </div>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.darkMode}
              onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="settings-section">
        <h2 className="settings-section-title">
          <span>🔔</span>
          Notifications
        </h2>
        
        <div className="setting-item">
          <div className="setting-info">
            <div className="setting-title">Enable notifications</div>
            <div className="setting-description">
              Show notifications for security events and auto-fill
            </div>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={(e) => handleSettingChange('notifications', e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      {/* Vault Information */}
      <div className="settings-section">
        <h2 className="settings-section-title">
          <span>📊</span>
          Vault Information
        </h2>
        
        <div className="info-grid">
          <div className="info-item">
            <div className="info-label">Total Entries</div>
            <div className="info-value">{vaultStats.totalEntries}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Last Backup</div>
            <div className="info-value">
              {vaultStats.lastBackup 
                ? new Date(vaultStats.lastBackup).toLocaleDateString()
                : 'Never'
              }
            </div>
          </div>
          <div className="info-item">
            <div className="info-label">Extension Version</div>
            <div className="info-value">v1.0.0</div>
          </div>
          <div className="info-item">
            <div className="info-label">Storage Used</div>
            <div className="info-value">~{Math.ceil(vaultStats.totalEntries * 0.5)}KB</div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="settings-section">
        <h2 className="settings-section-title">
          <span>💾</span>
          Data Management
        </h2>
        
        <div className="action-buttons">
          <button
            onClick={handleExportData}
            className="button secondary"
          >
            <span>📤</span>
            Export Data
          </button>
          
          <button
            onClick={handleClearLogs}
            className="button secondary"
            disabled={loading}
          >
            <span>🗑️</span>
            Clear Logs
          </button>
        </div>
      </div>

      {/* About Section */}
      <div className="settings-section">
        <h2 className="settings-section-title">
          <span>ℹ️</span>
          About
        </h2>
        
        <div className="about-content">
          <p className="about-text">
            ShadowVault is a secure password manager with Web3 integration, 
            built for ETHGlobal NY hackathon. Your data is encrypted and stored 
            locally in your browser.
          </p>
          
          <div className="about-links">
            <a href="#" className="about-link">Privacy Policy</a>
            <a href="#" className="about-link">Terms of Service</a>
            <a href="#" className="about-link">Source Code</a>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="settings-footer">
        <button onClick={onBack} className="button">
          <span>🏠</span>
          Back to Home
        </button>
      </div>

      <style jsx>{`
        .message {
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .message.success {
          background: #d4edda;
          color: #155724;
        }

        .message.error {
          background: #f8d7da;
          color: #721c24;
        }

        .settings-section {
          margin-bottom: 32px;
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
        }

        .settings-section-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #333;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          border-bottom: 1px solid #e9ecef;
        }

        .setting-item:last-child {
          border-bottom: none;
        }

        .setting-info {
          flex: 1;
        }

        .setting-title {
          font-weight: 500;
          color: #333;
          margin-bottom: 4px;
        }

        .setting-description {
          font-size: 14px;
          color: #666;
          line-height: 1.4;
        }

        .switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 24px;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
          border-radius: 24px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }

        input:checked + .slider {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        input:checked + .slider:before {
          transform: translateX(26px);
        }

        .setting-select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          min-width: 120px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .info-item {
          text-align: center;
          padding: 16px 12px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .info-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }

        .info-value {
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .action-buttons .button {
          flex: 1;
          min-width: 140px;
        }

        .about-content {
          background: white;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .about-text {
          color: #666;
          line-height: 1.5;
          margin-bottom: 16px;
        }

        .about-links {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .about-link {
          color: #667eea;
          text-decoration: none;
          font-size: 14px;
        }

        .about-link:hover {
          text-decoration: underline;
        }

        .settings-footer {
          margin-top: 32px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
        }

        .settings-footer .button {
          width: 100%;
        }
      `}</style>
    </div>
  );
};

export default VaultSettings;