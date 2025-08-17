import React, { useState, useEffect } from 'react';
import { getVaultData, getTransactionLogs, getCurrentTab } from '../chrome-api';

const Analytics = ({ onBack }) => {
  const [vaultData, setVaultData] = useState({ entries: [] });
  const [transactionLogs, setTransactionLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Load vault data
      const { data } = await getVaultData();
      setVaultData(data);
      
      // Load transaction logs
      const logs = await getTransactionLogs();
      setTransactionLogs(logs);
      
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUsageStats = () => {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentLogs = transactionLogs.filter(log => 
      new Date(log.timestamp) > last7Days
    );
    
    const monthlyLogs = transactionLogs.filter(log => 
      new Date(log.timestamp) > last30Days
    );
    
    return {
      totalEntries: vaultData.entries.length,
      recentActivity: recentLogs.length,
      monthlyActivity: monthlyLogs.length,
      totalSites: new Set(vaultData.entries.map(entry => {
        try {
          return new URL(entry.url).hostname;
        } catch {
          return 'unknown';
        }
      })).size,
      lastUsed: vaultData.entries.length > 0 
        ? new Date(Math.max(...vaultData.entries.map(e => new Date(e.updatedAt || e.createdAt))))
        : null
    };
  };

  const getTopSites = () => {
    const siteCounts = {};
    
    vaultData.entries.forEach(entry => {
      try {
        const hostname = new URL(entry.url).hostname;
        siteCounts[hostname] = (siteCounts[hostname] || 0) + 1;
      } catch {
        siteCounts['Unknown'] = (siteCounts['Unknown'] || 0) + 1;
      }
    });
    
    return Object.entries(siteCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([site, count]) => ({ site, count }));
  };

  const getPasswordStats = () => {
    const passwords = vaultData.entries.map(entry => entry.password);
    const lengths = passwords.map(p => p.length);
    
    const avgLength = lengths.length > 0 
      ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)
      : 0;
    
    const strongPasswords = passwords.filter(p => {
      return p.length >= 12 && 
             /[a-z]/.test(p) && 
             /[A-Z]/.test(p) && 
             /[0-9]/.test(p) && 
             /[^A-Za-z0-9]/.test(p);
    }).length;
    
    const weakPasswords = passwords.filter(p => p.length < 8).length;
    
    return {
      total: passwords.length,
      average: avgLength,
      strong: strongPasswords,
      weak: weakPasswords,
      strongPercentage: passwords.length > 0 
        ? Math.round((strongPasswords / passwords.length) * 100)
        : 0
    };
  };

  const getRecentActivity = () => {
    return transactionLogs
      .slice(0, 10)
      .map(log => ({
        ...log,
        hostname: (() => {
          try {
            return new URL(log.url).hostname;
          } catch {
            return 'Unknown';
          }
        })()
      }));
  };

  const stats = getUsageStats();
  const topSites = getTopSites();
  const passwordStats = getPasswordStats();
  const recentActivity = getRecentActivity();

  if (loading) {
    return (
      <div className="content-section">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-section">
      <h1 className="section-title">
        <span>📊</span>
        Analytics
      </h1>
      <p className="section-description">
        Insights into your password management and security habits
      </p>

      {/* Tab Navigation */}
      <div className="analytics-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Security
        </button>
        <button
          className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          Activity
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="analytics-content">
          {/* Key Metrics */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">🔑</div>
              <div className="metric-content">
                <div className="metric-number">{stats.totalEntries}</div>
                <div className="metric-label">Total Passwords</div>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">🌐</div>
              <div className="metric-content">
                <div className="metric-number">{stats.totalSites}</div>
                <div className="metric-label">Unique Sites</div>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">📅</div>
              <div className="metric-content">
                <div className="metric-number">{stats.recentActivity}</div>
                <div className="metric-label">This Week</div>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-icon">📈</div>
              <div className="metric-content">
                <div className="metric-number">{stats.monthlyActivity}</div>
                <div className="metric-label">This Month</div>
              </div>
            </div>
          </div>

          {/* Top Sites */}
          {topSites.length > 0 && (
            <div className="analytics-section">
              <h3 className="analytics-section-title">
                <span>🏆</span>
                Most Used Sites
              </h3>
              <div className="top-sites">
                {topSites.map((item, index) => (
                  <div key={index} className="site-item">
                    <div className="site-rank">#{index + 1}</div>
                    <div className="site-info">
                      <div className="site-name">{item.site}</div>
                      <div className="site-count">{item.count} password{item.count !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="analytics-content">
          {/* Password Security Overview */}
          <div className="security-overview">
            <div className="security-score">
              <div className="score-circle">
                <div className="score-number">{passwordStats.strongPercentage}%</div>
                <div className="score-label">Strong Passwords</div>
              </div>
            </div>
            
            <div className="security-stats">
              <div className="security-stat">
                <div className="stat-number">{passwordStats.strong}</div>
                <div className="stat-label strong">Strong</div>
              </div>
              <div className="security-stat">
                <div className="stat-number">{passwordStats.total - passwordStats.strong - passwordStats.weak}</div>
                <div className="stat-label medium">Medium</div>
              </div>
              <div className="security-stat">
                <div className="stat-number">{passwordStats.weak}</div>
                <div className="stat-label weak">Weak</div>
              </div>
            </div>
          </div>

          {/* Password Insights */}
          <div className="analytics-section">
            <h3 className="analytics-section-title">
              <span>🔍</span>
              Password Insights
            </h3>
            <div className="insights-grid">
              <div className="insight-card">
                <div className="insight-label">Average Length</div>
                <div className="insight-value">{passwordStats.average} characters</div>
              </div>
              <div className="insight-card">
                <div className="insight-label">Security Score</div>
                <div className="insight-value">{passwordStats.strongPercentage}% Strong</div>
              </div>
              <div className="insight-card">
                <div className="insight-label">Needs Attention</div>
                <div className="insight-value">{passwordStats.weak} passwords</div>
              </div>
            </div>
          </div>

          {/* Security Recommendations */}
          <div className="analytics-section">
            <h3 className="analytics-section-title">
              <span>💡</span>
              Recommendations
            </h3>
            <div className="recommendations">
              {passwordStats.weak > 0 && (
                <div className="recommendation">
                  <div className="recommendation-icon">⚠️</div>
                  <div className="recommendation-text">
                    <strong>Update weak passwords:</strong> You have {passwordStats.weak} password{passwordStats.weak !== 1 ? 's' : ''} that should be strengthened.
                  </div>
                </div>
              )}
              
              {passwordStats.strongPercentage < 80 && (
                <div className="recommendation">
                  <div className="recommendation-icon">🎯</div>
                  <div className="recommendation-text">
                    <strong>Improve security:</strong> Aim for 80% or more strong passwords for better security.
                  </div>
                </div>
              )}
              
              <div className="recommendation">
                <div className="recommendation-icon">🔄</div>
                <div className="recommendation-text">
                  <strong>Regular updates:</strong> Consider updating passwords older than 6 months.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="analytics-content">
          <div className="analytics-section">
            <h3 className="analytics-section-title">
              <span>🕒</span>
              Recent Activity
            </h3>
            
            {recentActivity.length > 0 ? (
              <div className="activity-list">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">
                      {activity.activityType === 'accountsChanged' ? '👤' :
                       activity.activityType === 'chainChanged' ? '🔗' :
                       activity.activityType === 'sensitiveOperation' ? '⚡' : '🌐'}
                    </div>
                    <div className="activity-info">
                      <div className="activity-title">
                        {activity.activityType === 'accountsChanged' ? 'Account Changed' :
                         activity.activityType === 'chainChanged' ? 'Network Changed' :
                         activity.activityType === 'sensitiveOperation' ? 'Transaction Detected' : 'Web3 Activity'}
                      </div>
                      <div className="activity-details">
                        <span className="activity-site">{activity.hostname}</span>
                        <span className="activity-time">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <div className="empty-state-title">No Recent Activity</div>
                <div className="empty-state-description">
                  Your Web3 activity will appear here when detected
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="analytics-footer">
        <button onClick={onBack} className="button">
          <span>🏠</span>
          Back to Home
        </button>
      </div>

      <style jsx>{`
        .analytics-tabs {
          display: flex;
          background: #f8f9fa;
          border-radius: 8px;
          padding: 4px;
          margin-bottom: 24px;
        }

        .tab {
          flex: 1;
          background: none;
          border: none;
          padding: 12px;
          cursor: pointer;
          border-radius: 6px;
          font-size: 14px;
          color: #666;
          transition: all 0.2s;
        }

        .tab.active {
          background: white;
          color: #667eea;
          font-weight: 500;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .analytics-content {
          margin-bottom: 24px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .metric-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .metric-icon {
          font-size: 24px;
        }

        .metric-content {
          flex: 1;
        }

        .metric-number {
          font-size: 20px;
          font-weight: 700;
          line-height: 1;
        }

        .metric-label {
          font-size: 12px;
          opacity: 0.9;
          margin-top: 2px;
        }

        .analytics-section {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .analytics-section-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #333;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .top-sites {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .site-item {
          display: flex;
          align-items: center;
          padding: 12px;
          background: white;
          border-radius: 8px;
          gap: 12px;
        }

        .site-rank {
          background: #667eea;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
        }

        .site-info {
          flex: 1;
        }

        .site-name {
          font-weight: 500;
          color: #333;
        }

        .site-count {
          font-size: 12px;
          color: #666;
        }

        .security-overview {
          display: flex;
          align-items: center;
          gap: 24px;
          background: #f8f9fa;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
        }

        .security-score {
          text-align: center;
        }

        .score-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .score-number {
          font-size: 20px;
          font-weight: 700;
        }

        .score-label {
          font-size: 10px;
          opacity: 0.9;
        }

        .security-stats {
          display: flex;
          gap: 20px;
          flex: 1;
        }

        .security-stat {
          text-align: center;
          flex: 1;
        }

        .security-stat .stat-number {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .security-stat .stat-label {
          font-size: 12px;
          font-weight: 500;
          padding: 4px 8px;
          border-radius: 12px;
        }

        .stat-label.strong {
          background: #d4edda;
          color: #155724;
        }

        .stat-label.medium {
          background: #fff3cd;
          color: #856404;
        }

        .stat-label.weak {
          background: #f8d7da;
          color: #721c24;
        }

        .insights-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .insight-card {
          background: white;
          padding: 16px;
          border-radius: 8px;
          text-align: center;
        }

        .insight-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }

        .insight-value {
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        .recommendations {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .recommendation {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          background: white;
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }

        .recommendation-icon {
          font-size: 18px;
        }

        .recommendation-text {
          flex: 1;
          font-size: 14px;
          line-height: 1.4;
          color: #666;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: white;
          border-radius: 8px;
        }

        .activity-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .activity-info {
          flex: 1;
        }

        .activity-title {
          font-weight: 500;
          color: #333;
          margin-bottom: 2px;
        }

        .activity-details {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #666;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #666;
        }

        .empty-state-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-state-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #333;
        }

        .empty-state-description {
          font-size: 14px;
          line-height: 1.5;
        }

        .analytics-footer {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
        }

        .analytics-footer .button {
          width: 100%;
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

export default Analytics;