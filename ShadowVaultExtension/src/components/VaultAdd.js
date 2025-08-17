import React, { useState, useEffect } from 'react';
import { loadVault, saveVault, addTransactionLog } from '../lib/storage';
import { generateSecurePassword, calculatePasswordStrength } from '../lib/crypto';
import { getCurrentTab } from '../chrome-api';

const VaultAdd = ({ currentUrl, onBack, masterPassword }) => {
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    username: '',
    password: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Pre-fill form with current tab info
    const initializeForm = async () => {
      try {
        const tab = await getCurrentTab();
        if (tab) {
          const url = new URL(tab.url);
          setFormData(prev => ({
            ...prev,
            title: tab.title || url.hostname,
            url: tab.url
          }));
        }
      } catch (error) {
        console.error('Error initializing form:', error);
      }
    };

    initializeForm();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const generatePassword = () => {
    try {
      const password = generateSecurePassword({
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: true
      });
      
      setFormData(prev => ({
        ...prev,
        password
      }));
    } catch (error) {
      console.error('Error generating password:', error);
      setError('Failed to generate secure password');
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Please enter a title');
      return false;
    }
    
    if (!formData.username.trim()) {
      setError('Please enter a username or email');
      return false;
    }
    
    if (!formData.password.trim()) {
      setError('Please enter a password');
      return false;
    }
    
    if (formData.password.length < 4) {
      setError('Password must be at least 4 characters long');
      return false;
    }

    return true;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (!masterPassword) {
      setError('Master password is required to save entries');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // Load existing vault data
      const vaultData = await loadVault(masterPassword);
      
      // Create new entry
      const newEntry = {
        id: Date.now().toString(),
        title: formData.title.trim(),
        url: formData.url.trim(),
        username: formData.username.trim(),
        password: formData.password,
        notes: formData.notes.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        category: 'password' // Default category
      };
      
      // Add to vault data
      const updatedVaultData = {
        ...vaultData,
        entries: [newEntry, ...(vaultData.entries || [])],
        updatedAt: new Date().toISOString()
      };
      
      // Save encrypted vault data
      await saveVault(updatedVaultData, masterPassword);
      
      // Log the transaction
      await addTransactionLog({
        type: 'entry_created',
        entryId: newEntry.id,
        action: 'Created new password entry',
        metadata: {
          title: newEntry.title,
          url: newEntry.url
        }
      });
      
      setSuccess(true);
      
      // Auto-navigate back after success
      setTimeout(() => {
        onBack();
      }, 1500);
      
    } catch (error) {
      console.error('Error saving entry:', error);
      if (error.message.includes('incorrect password') || error.message.includes('Failed to decrypt')) {
        setError('Authentication failed. Please unlock vault again.');
      } else {
        setError('Failed to save entry. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: 'Very Weak', color: '#e74c3c' };
    
    try {
      const analysis = calculatePasswordStrength(password);
      return {
        strength: analysis.score,
        label: analysis.strength,
        color: analysis.color
      };
    } catch (error) {
      console.error('Error calculating password strength:', error);
      return { strength: 0, label: 'Error', color: '#e74c3c' };
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  if (success) {
    return (
      <div className="content-section">
        <div className="success-container">
          <div className="success-icon">✅</div>
          <h2 className="success-title">Entry Saved!</h2>
          <p className="success-message">
            Your credentials have been securely saved to ShadowVault.
          </p>
          <button onClick={onBack} className="button">
            <span>🏠</span>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="content-section">
      <h1 className="section-title">
        <span>➕</span>
        Add New Entry
      </h1>
      <p className="section-description">
        Add new credentials to your secure vault
      </p>

      <form onSubmit={handleSave} className="add-form">
        {/* Title */}
        <div className="form-group">
          <label htmlFor="title" className="form-label">
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="form-input"
            placeholder="e.g., Gmail, GitHub, Banking"
          />
        </div>

        {/* URL */}
        <div className="form-group">
          <label htmlFor="url" className="form-label">
            Website URL
          </label>
          <input
            type="url"
            id="url"
            value={formData.url}
            onChange={(e) => handleInputChange('url', e.target.value)}
            className="form-input"
            placeholder="https://example.com"
          />
        </div>

        {/* Username */}
        <div className="form-group">
          <label htmlFor="username" className="form-label">
            Username / Email *
          </label>
          <input
            type="text"
            id="username"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            className="form-input"
            placeholder="username@example.com"
          />
        </div>

        {/* Password */}
        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Password *
          </label>
          <div className="password-input-group">
            <input
              type="text"
              id="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="form-input"
              placeholder="Enter or generate a password"
            />
            <button
              type="button"
              onClick={generatePassword}
              className="generate-button"
              title="Generate strong password"
            >
              🎲
            </button>
          </div>
          
          {formData.password && (
            <div className="password-strength">
              <div className="strength-bar">
                <div 
                  className="strength-fill"
                  style={{
                    width: `${(passwordStrength.strength / 6) * 100}%`,
                    backgroundColor: passwordStrength.color
                  }}
                />
              </div>
              <span className="strength-label" style={{ color: passwordStrength.color }}>
                {passwordStrength.label}
              </span>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="form-group">
          <label htmlFor="notes" className="form-label">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            className="form-input form-textarea"
            placeholder="Additional notes about this account..."
            rows="3"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onBack}
            className="button secondary"
          >
            <span>❌</span>
            Cancel
          </button>
          <button
            type="submit"
            className="button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Saving...
              </>
            ) : (
              <>
                <span>💾</span>
                Save Entry
              </>
            )}
          </button>
        </div>
      </form>

      <style jsx>{`
        .add-form {
          margin-top: 20px;
        }

        .password-input-group {
          position: relative;
          display: flex;
          align-items: center;
        }

        .password-input-group .form-input {
          padding-right: 50px;
        }

        .generate-button {
          position: absolute;
          right: 8px;
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          padding: 8px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .generate-button:hover {
          background: #f0f0f0;
        }

        .password-strength {
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .strength-bar {
          flex: 1;
          height: 4px;
          background: #e9ecef;
          border-radius: 2px;
          overflow: hidden;
        }

        .strength-fill {
          height: 100%;
          transition: all 0.3s ease;
          border-radius: 2px;
        }

        .strength-label {
          font-size: 12px;
          font-weight: 500;
          min-width: 60px;
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

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .form-actions .button {
          flex: 1;
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

        .success-container {
          text-align: center;
          padding: 60px 20px;
        }

        .success-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .success-title {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #27ae60;
        }

        .success-message {
          color: #666;
          margin-bottom: 24px;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};

export default VaultAdd;