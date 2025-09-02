# Development Guide

## Quick Start

1. **Start MongoDB** (required for backend):
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:7
   ```

2. **Start Backend** (already running via task):
   ```bash
   cd backend && npm run dev
   ```
   - API Server: http://localhost:8080
   - CDR Socket: Port 5432

3. **Start Frontend** (already running via task):
   ```bash
   cd frontend && npm run dev
   ```
   - Dashboard: http://localhost:5173

## Testing the Application

### Without Real 3CX Data

Since you don't have a 3CX system connected yet, you can test the application by manually inserting some sample data into MongoDB:

1. **Connect to MongoDB:**
   ```bash
   docker exec -it mongodb mongosh 3cx_cdr
   ```

2. **Insert Sample Data:**
   ```javascript
   db.calls.insertMany([
     {
       callId: "sample-001",
       direction: "incoming",
       fromNumber: "15551234567",
       toNumber: "101",
       start: new Date("2024-01-01T10:00:00Z"),
       answered: new Date("2024-01-01T10:00:05Z"),
       end: new Date("2024-01-01T10:02:30Z"),
       durationSec: 145,
       areaCode: "555",
       cost: 0,
       day: "2024-01-01"
     },
     {
       callId: "sample-002", 
       direction: "outgoing",
       fromNumber: "101",
       toNumber: "15559876543",
       start: new Date("2024-01-01T11:00:00Z"),
       answered: new Date("2024-01-01T11:00:03Z"),
       end: new Date("2024-01-01T11:05:20Z"),
       durationSec: 317,
       areaCode: "559",
       cost: 0.25,
       day: "2024-01-01"
     }
   ])
   ```

3. **View Dashboard:**
   - Go to http://localhost:5173
   - You should see the sample calls in your KPIs and charts

### With Real 3CX System

Configure your 3CX system according to the Settings page:
- Go to Dashboard → Settings for configuration instructions
- Point 3CX CDR to your server's IP address on port 5432

## API Testing

Test the REST endpoints directly:

```bash
# Get KPIs
curl http://localhost:8080/api/kpis

# Get top area codes  
curl http://localhost:8080/api/area-codes/top

# Get settings
curl http://localhost:8080/api/settings

# Health check
curl http://localhost:8080/health
```

## Project Structure

```
3cx-cdr-platform/
├── backend/                 # Node.js TypeScript API
│   ├── src/
│   │   ├── models/         # MongoDB schemas (Call, AppMeta)
│   │   ├── routes/         # API routes (cdr.ts, settings.ts)
│   │   ├── services/       # Business logic (cdr-parser.ts)
│   │   ├── tcp/           # CDR ingestion server (cdr-server.ts)
│   │   └── index.ts       # Main application
│   └── package.json
├── frontend/               # React TypeScript dashboard
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Dashboard.tsx, Settings.tsx
│   │   ├── services/      # API client (api.ts)
│   │   └── main.tsx       # App entry point
│   └── package.json
├── docker-compose.yml     # Container orchestration
├── .env                   # Environment variables
└── README.md
```

## Environment Variables

Make sure your `.env` file contains:

```env
MONGO_URI=mongodb://localhost:27017/3cx_cdr
PORT=8080
CDR_PORT=5432
NODE_ENV=development
SERVER_IP=localhost
```

## Troubleshooting

1. **MongoDB Connection Issues:**
   - Make sure MongoDB is running: `docker ps`
   - Check connection string in `.env`

2. **CDR Data Not Appearing:**
   - Check backend logs for parsing errors
   - Verify 3CX configuration matches Settings page
   - Test with sample data first

3. **Frontend Not Loading:**
   - Check if backend API is running on port 8080
   - Verify proxy configuration in `vite.config.ts`

4. **Build Errors:**
   - Run `npm install` in both backend and frontend directories
   - Check TypeScript errors with `npm run build`
