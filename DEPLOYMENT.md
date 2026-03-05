# Deployment Guide: VirtualTrade Pro

This guide providing instructions for deploying the application.

## Render Deployment (Recommended)

1. **Create a New Web Service**: Link your GitHub repository to Render.
2. **Environment Variables**: Add the following in the Render Dashboard:
   - `PORT`: `10000` (or leave as default, Render handles this)
   - `JWT_SECRET`: Your secret key
   - `FINNHUB_API_KEY`: Your Finnhub API key
   - `VITE_API_BASE_URL`: `/api`
3. **Build Command**: `npm run render-build`
4. **Start Command**: `npm start`

## Manual Deployment (Local / Direct Server)

### 1. Build the Frontend
```powershell
cd frontend
npm install
npm run build
cd ..
```

### 2. Start the Backend
```powershell
cd backend
npm install
node server.js
```

The application will be available at [http://localhost:5000](http://localhost:5000) (if running locally).

## Persistent Data (SQLite)
- Both manual and Render deployments use a local `database.sqlite` file.
- **Note**: On Render's free tier, this file is ephemeral (resets on restart). For persistent data on Render, consider using their managed PostgreSQL service.
