import { useState, useEffect } from 'react';
import './App.css';

// Mock data for development - replace with /api/dashboard in production
const mockData = {
  totalUsers: 1247,
  totalRoles: 89,
  pendingApprovals: 23,
  highRiskAssignments: 7,
  recentProvisioning: [
    { user: 'john.doe@company.com', role: 'Global Reader', app: 'Azure', status: 'Completed', date: '2026-04-27' },
    { user: 'jane.smith@company.com', role: 'Security Admin', app: 'Entra ID', status: 'Pending', date: '2026-04-27' },
    { user: 'bob.wilson@company.com', role: 'Application Owner', app: 'Office 365', status: 'Completed', date: '2026-04-26' },
    { user: 'alice.jones@company.com', role: 'Privileged Role Admin', app: 'Entra ID', status: 'Pending', date: '2026-04-26' },
  ],
  roleDistribution: [
    { role: 'Global Admin', count: 5 },
    { role: 'User Admin', count: 12 },
    { role: 'Security Admin', count: 8 },
    { role: 'Global Reader', count: 45 },
    { role: 'Application Admin', count: 19 },
  ],
  approvals: [
    { id: 1, user: 'mike.chen@company.com', role: 'Exchange Admin', requested: '2026-04-27', status: 'Pending' },
    { id: 2, user: 'sarah.lee@company.com', role: 'Teams Admin', requested: '2026-04-26', status: 'Pending' },
    { id: 3, user: 'david.brown@company.com', role: 'SharePoint Admin', requested: '2026-04-25', status: 'Approved' },
  ],
};

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/dashboard');
        if (!res.ok) throw new Error('API not available');
        const json = await res.json();
        setData(json);
      } catch {
        setData(mockData);
        console.log('Using mock data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleApprove = async (id) => {
    try {
      await fetch(`/api/approvals/${id}/approve`, { method: 'POST' });
      alert(`Approval ${id} submitted`);
    } catch {
      alert('Mock: Approval submitted');
    }
  };

  const handleDeny = async (id) => {
    alert(`Mock: Approval ${id} denied`);
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  const d = data;

  return (
    <div className="dashboard">
      <header className="header">
        <h1>Entra ID RBAC Dashboard</h1>
        <div className="header-actions">
          <span className="status-badge">Connected</span>
          <button onClick={() => window.location.reload()}>Refresh</button>
        </div>
      </header>

      <nav className="tabs">
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={activeTab === 'provisioning' ? 'active' : ''} onClick={() => setActiveTab('provisioning')}>Provisioning</button>
        <button className={activeTab === 'approvals' ? 'active' : ''} onClick={() => setActiveTab('approvals')}>Approvals</button>
        <button className={activeTab === 'roles' ? 'active' : ''} onClick={() => setActiveTab('roles')}>Role Distribution</button>
      </nav>

      {activeTab === 'overview' && (
        <main className="content">
          <div className="kpi-grid">
            <div className="kpi-card">
              <h3>Total Users</h3>
              <p className="kpi-value">{d.totalUsers}</p>
              <span className="kpi-trend up">+12 this week</span>
            </div>
            <div className="kpi-card">
              <h3>Total Roles</h3>
              <p className="kpi-value">{d.totalRoles}</p>
              <span className="kpi-trend stable">Active</span>
            </div>
            <div className="kpi-card warning">
              <h3>Pending Approvals</h3>
              <p className="kpi-value">{d.pendingApprovals}</p>
              <span className="kpi-trend down">Needs attention</span>
            </div>
            <div className="kpi-card danger">
              <h3>High Risk Assignments</h3>
              <p className="kpi-value">{d.highRiskAssignments}</p>
              <span className="kpi-trend down">Review required</span>
            </div>
          </div>
          <section className="section">
            <h2>Recent Provisioning</h2>
            <table className="data-table">
              <thead><tr><th>User</th><th>Role</th><th>App</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {d.recentProvisioning.map((r, i) => (
                  <tr key={i}>
                    <td>{r.user}</td><td>{r.role}</td><td>{r.app}</td>
                    <td><span className={`status ${r.status.toLowerCase()}`}>{r.status}</span></td>
                    <td>{r.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </main>
      )}

      {activeTab === 'provisioning' && (
        <main className="content">
          <section className="section">
            <h2>All Provisioning Activities</h2>
            <table className="data-table">
              <thead><tr><th>User</th><th>Role</th><th>App</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {d.recentProvisioning.map((r, i) => (
                  <tr key={i}>
                    <td>{r.user}</td><td>{r.role}</td><td>{r.app}</td>
                    <td><span className={`status ${r.status.toLowerCase()}`}>{r.status}</span></td>
                    <td>{r.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </main>
      )}

      {activeTab === 'approvals' && (
        <main className="content">
          <section className="section">
            <h2>Pending Approvals</h2>
            <table className="data-table">
              <thead><tr><th>ID</th><th>User</th><th>Role</th><th>Requested</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {d.approvals.map((a) => (
                  <tr key={a.id}>
                    <td>#{a.id}</td><td>{a.user}</td><td>{a.role}</td>
                    <td>{a.requested}</td>
                    <td><span className={`status ${a.status.toLowerCase()}`}>{a.status}</span></td>
                    <td>
                      {a.status === 'Pending' && (
                        <>
                          <button className="btn-approve" onClick={() => handleApprove(a.id)}>Approve</button>
                          <button className="btn-deny" onClick={() => handleDeny(a.id)}>Deny</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </main>
      )}

      {activeTab === 'roles' && (
        <main className="content">
          <section className="section">
            <h2>Role Distribution</h2>
            <div className="role-bars">
              {d.roleDistribution.map((r, i) => (
                <div key={i} className="role-bar-row">
                  <span className="role-name">{r.role}</span>
                  <div className="bar-container">
                    <div className="bar" style={{ width: `${(r.count / 50) * 100}%` }}></div>
                  </div>
                  <span className="role-count">{r.count}</span>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}
    </div>
  );
}

export default App;
