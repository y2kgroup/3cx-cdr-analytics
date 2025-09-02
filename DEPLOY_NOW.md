## 🚀 DEPLOY YOUR 3CX APP TO RAILWAY

### Step 1: Create GitHub Repository
1. Go to: https://github.com/new
2. Name: `3cx-cdr-analytics` 
3. Description: `3CX CDR Analytics Platform`
4. **Public** repository
5. Click "Create repository"

### Step 2: Push Code to GitHub
Copy these commands into your terminal:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/3cx-cdr-analytics.git
git push -u origin main
```

Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username.

### Step 3: Deploy to Railway
1. In Railway dashboard, click "Create a New Project"
2. Choose "Deploy from GitHub repo"
3. Select your `3cx-cdr-analytics` repository
4. Railway will detect and deploy automatically!

### Step 4: Add MongoDB
1. In Railway project, click "New Service"
2. Select "MongoDB"
3. Railway will provision a MongoDB database

### Step 5: Configure Environment Variables
In Railway dashboard, add these variables:
```
NODE_ENV=production
CDR_PORT=5432
MONGO_URI=mongodb://mongo:27017/3cx_cdr
```

### Step 6: Get Your URLs
Railway will provide:
- **Frontend URL**: `https://your-app.railway.app` 
- **Backend URL**: `https://backend-service.railway.app`
- **CDR Socket**: `backend-service.railway.app:5432`

### Step 7: Configure 3CX
Point your 3CX CDR Active Socket to:
- **Server**: `backend-service.railway.app`
- **Port**: `5432`
- **Protocol**: TCP
- **Format**: TAB delimited

🎉 **Your 3CX analytics will be live in the cloud!**
