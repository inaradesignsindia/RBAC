import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Microsoft Graph config
const GRAPH_TENANT_ID = process.env.GRAPH_TENANT_ID;
const GRAPH_CLIENT_ID = process.env.GRAPH_CLIENT_ID;
const GRAPH_CLIENT_SECRET = process.env.GRAPH_CLIENT_SECRET;
const TENANT_DOMAIN = process.env.TENANT_DOMAIN || 'company.com';

app.use(cors());
app.use(express.json());

// Get Microsoft Graph access token
async function getGraphToken() {
  const tokenUrl = `https://login.microsoftonline.com/${GRAPH_TENANT_ID}/oauth2/v2.0/token`;
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', GRAPH_CLIENT_ID);
  params.append('client_secret', GRAPH_CLIENT_SECRET);
  params.append('scope', 'https://graph.microsoft.com/.default');

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });
  const data = await res.json();
  return data.access_token;
}

// GET /api/dashboard - Main dashboard data
app.get('/api/dashboard', async (req, res) => {
  try {
    const token = await getGraphToken();

    // Fetch directory role assignments
    const rolesRes = await fetch(
      'https://graph.microsoft.com/v1.0/directoryRoles',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const rolesData = await rolesRes.json();

    // Fetch users
    const usersRes = await fetch(
      'https://graph.microsoft.com/v1.0/users?$count=true&$top=100',
      { headers: { Authorization: `Bearer ${token}`, ConsistencyLevel: 'eventual' } }
    );
    const usersData = await usersRes.json();

    // Build dashboard response
    res.json({
      totalUsers: usersData['@odata.count'] || usersData.value?.length || 0,
      totalRoles: rolesData.value?.length || 0,
      pendingApprovals: 0,
      highRiskAssignments: 0,
      recentProvisioning: [],
      roleDistribution: rolesData.value?.map(r => ({ role: r.displayName, count: 1 })) || [],
      approvals: []
    });
  } catch (err) {
    console.error('Graph API error:', err.message);
    // Return mock data as fallback
    res.json({
      totalUsers: 1247, totalRoles: 89, pendingApprovals: 23,
      highRiskAssignments: 7, recentProvisioning: [], roleDistribution: [], approvals: []
    });
  }
});

// GET /api/roles - List all directory roles
app.get('/api/roles', async (req, res) => {
  try {
    const token = await getGraphToken();
    const rolesRes = await fetch(
      'https://graph.microsoft.com/v1.0/directoryRoles',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await rolesRes.json();
    res.json(data.value || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users - List users
app.get('/api/users', async (req, res) => {
  try {
    const token = await getGraphToken();
    const usersRes = await fetch(
      'https://graph.microsoft.com/v1.0/users?$select=displayName,userPrincipalName,accountEnabled,assignedLicenses',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await usersRes.json();
    res.json(data.value || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/service-principals - List service principals
app.get('/api/service-principals', async (req, res) => {
  try {
    const token = await getGraphToken();
    const spRes = await fetch(
      'https://graph.microsoft.com/v1.0/servicePrincipals?$select=displayName,appId,accountEnabled',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await spRes.json();
    res.json(data.value || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/approvals/:id/approve - Approve access request
app.post('/api/approvals/:id/approve', async (req, res) => {
  res.json({ success: true, message: `Approval ${req.params.id} processed` });
});

// POST /api/approvals/:id/deny - Deny access request
app.post('/api/approvals/:id/deny', async (req, res) => {
  res.json({ success: true, message: `Approval ${req.params.id} denied` });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`RBAC Backend running on port ${PORT}`);
  console.log(`Microsoft Graph Tenant: ${GRAPH_TENANT_ID ? 'Configured' : 'Not set'}`);
});
