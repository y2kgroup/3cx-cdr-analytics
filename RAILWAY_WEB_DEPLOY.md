# Railway Web Deployment Guide

## Step 1: Login to Railway
✅ Login at: https://railway.app/login
📧 Email: yosi.nuri@y2kgroupit.com

## Step 2: Create New Project
1. Click "New Project" 
2. Select "Deploy from GitHub repo"
3. Connect your GitHub account
4. Create a new repository for this code

## Step 3: Upload Code to GitHub
```bash
# Initialize git in your project
cd /Users/yosinuri/Desktop/React/3CX
git init
git add .
git commit -m "Initial commit - 3CX CDR Analytics"

# Create GitHub repo (or use GitHub web interface)
gh repo create 3cx-cdr-analytics --public --push
```

## Step 4: Deploy Services in Railway

### Backend Service:
1. Click "New Service" → "GitHub Repo"
2. Select your 3cx-cdr-analytics repo
3. **Root Directory**: `/backend`
4. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=8080
   CDR_PORT=5432
   MONGO_URI=mongodb://mongo:27017/3cx_cdr
   ```

### Frontend Service:
1. Click "New Service" → "GitHub Repo"  
2. Select same repo
3. **Root Directory**: `/frontend`
4. **Environment Variables**:
   ```
   VITE_API_URL=https://backend-service-url.railway.app
   ```

### Database Service:
1. Click "New Service" → "Database" → "MongoDB"
2. Railway will automatically provision MongoDB

## Step 5: Configure 3CX
Once deployed, you'll get URLs like:
- Backend: `https://backend-abc123.railway.app`
- CDR Socket: `backend-abc123.railway.app:5432`

Configure 3CX CDR Active Socket:
- **Server**: `backend-abc123.railway.app`
- **Port**: `5432`
- **Protocol**: TCP
- **Format**: TAB delimited

## Alternative: One-Click Template
I can also create a Railway template for instant deployment!
