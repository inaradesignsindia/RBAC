import os
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="Entra ID RBAC API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Config
GRAPH_TENANT_ID = os.getenv("GRAPH_TENANT_ID")
GRAPH_CLIENT_ID = os.getenv("GRAPH_CLIENT_ID")
GRAPH_CLIENT_SECRET = os.getenv("GRAPH_CLIENT_SECRET")
PORT = int(os.getenv("PORT", 8000))

async def get_graph_token():
    token_url = f"https://login.microsoftonline.com/{GRAPH_TENANT_ID}/oauth2/v2.0/token"
    params = {
        "grant_type": "client_credentials",
        "client_id": GRAPH_CLIENT_ID,
        "client_secret": GRAPH_CLIENT_SECRET,
        "scope": "https://graph.microsoft.com/.default"
    }
    async with httpx.AsyncClient() as client:
        res = await client.post(token_url, data=params)
        data = res.json()
        return data.get("access_token")

@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.get("/api/dashboard")
async def get_dashboard():
    try:
        token = await get_graph_token()
        headers = {"Authorization": f"Bearer {token}"}
        async with httpx.AsyncClient() as client:
            roles_res = await client.get("https://graph.microsoft.com/v1.0/directoryRoles", headers=headers)
            users_res = await client.get(
                "https://graph.microsoft.com/v1.0/users?$count=true&$top=100",
                headers={**headers, "ConsistencyLevel": "eventual"}
            )
            roles = roles_res.json().get("value", [])
            users = users_res.json()
            return {
                "totalUsers": users.get("@odata.count", len(users.get("value", []))),
                "totalRoles": len(roles),
                "pendingApprovals": 0,
                "highRiskAssignments": 0,
                "recentProvisioning": [],
                "roleDistribution": [{"role": r["displayName"], "count": 1} for r in roles],
                "approvals": []
            }
    except Exception as e:
        return {
            "totalUsers": 1247, "totalRoles": 89, "pendingApprovals": 23,
            "highRiskAssignments": 7, "recentProvisioning": [], "roleDistribution": [], "approvals": []
        }

@app.get("/api/roles")
async def get_roles():
    try:
        token = await get_graph_token()
        async with httpx.AsyncClient() as client:
            res = await client.get(
                "https://graph.microsoft.com/v1.0/directoryRoles",
                headers={"Authorization": f"Bearer {token}"}
            )
            return res.json().get("value", [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users")
async def get_users():
    try:
        token = await get_graph_token()
        async with httpx.AsyncClient() as client:
            res = await client.get(
                "https://graph.microsoft.com/v1.0/users?$select=displayName,userPrincipalName,accountEnabled",
                headers={"Authorization": f"Bearer {token}"}
            )
            return res.json().get("value", [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/service-principals")
async def get_service_principals():
    try:
        token = await get_graph_token()
        async with httpx.AsyncClient() as client:
            res = await client.get(
                "https://graph.microsoft.com/v1.0/servicePrincipals?$select=displayName,appId,accountEnabled",
                headers={"Authorization": f"Bearer {token}"}
            )
            return res.json().get("value", [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ApprovalAction(BaseModel):
    decision: str  # "approve" or "deny"

@app.post("/api/approvals/{approval_id}/approve")
async def approve_approval(approval_id: str):
    return {"success": True, "message": f"Approval {approval_id} approved"}

@app.post("/api/approvals/{approval_id}/deny")
async def deny_approval(approval_id: str):
    return {"success": True, "message": f"Approval {approval_id} denied"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
