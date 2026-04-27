# Entra ID RBAC Dashboard

Microsoft Entra ID Role-Based Access Control (RBAC) Dashboard with React frontend and Node.js/FastAPI backend.

## Architecture

- **Frontend**: React + Vite (deployed on Netlify)
- **Backend**: Node.js (Express) or FastAPI (deployed on OCI Compute / Render / Azure App Service)
- **Database**: Oracle Autonomous AI Database (Free Tier) or any PostgreSQL
- **Identity Source**: Microsoft Entra ID via Microsoft Graph API

## Project Structure

```
RBAC/
  README.md
  netlify.toml
  frontend/          # React + Vite dashboard
  backend-node/      # Express.js API server
  backend-fastapi/   # FastAPI server (alternative)
```

## Quick Start

### Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

### Backend (Node.js)
```bash
cd backend-node
npm install
node server.js
```

### Backend (FastAPI)
```bash
cd backend-fastapi
pip install -r requirements.txt
uvicorn main:app --reload
```

## Microsoft Graph API Setup

1. Register an app in Microsoft Entra ID
2. Create a client secret
3. Grant Graph API permissions:
   - `RoleManagement.Read.Directory`
   - `Directory.Read.All`
   - `Application.Read.All`
4. Set environment variables in backend

## Deployment

### Frontend to Netlify
1. Push to GitHub
2. Connect repo in Netlify
3. Build: `npm install && npm run build`
4. Publish directory: `dist`

### Backend to OCI Compute
1. Upload backend to OCI VM
2. Install Node.js or Python
3. Set env vars (GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET, GRAPH_TENANT_ID)
4. Run with PM2 or systemd

## Environment Variables

```
GRAPH_CLIENT_ID=your-app-id
GRAPH_CLIENT_SECRET=your-client-secret
GRAPH_TENANT_ID=your-tenant-id
DATABASE_URL=your-db-connection-string
PORT=3000
```
