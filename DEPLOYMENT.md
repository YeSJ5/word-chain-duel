# Word Chain Duel - Deployment Guide

This guide explains how to deploy the Word Chain Duel game with the backend on Railway and frontend on Vercel.

## Architecture

- **Backend**: Node.js/Express API running on Railway
- **Frontend**: React/Vite SPA running on Vercel
- **Database**: MySQL/TiDB (set up on Railway or external provider)

## Prerequisites

1. GitHub account with the project repository
2. Railway account (https://railway.app)
3. Vercel account (https://vercel.com)
4. Environment variables ready (OAuth, API keys, database URL)

## Step 1: Set Up GitHub Repository

```bash
# Initialize and push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/word-chain-duel.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy Backend to Railway

### Option A: Using Railway Dashboard

1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select your `word-chain-duel` repository
4. Railway will auto-detect the Node.js project
5. Add environment variables:
   - `DATABASE_URL`: Your MySQL connection string
   - `JWT_SECRET`: Generate a random secret
   - `VITE_APP_ID`: Your OAuth app ID
   - `OAUTH_SERVER_URL`: OAuth server URL
   - `OWNER_OPEN_ID`: Owner's OpenID
   - `OWNER_NAME`: Owner's name
   - `BUILT_IN_FORGE_API_URL`: Manus API URL
   - `BUILT_IN_FORGE_API_KEY`: Manus API key
   - `NODE_ENV`: `production`

6. Click "Deploy"
7. Railway will build and deploy automatically
8. Note the generated URL (e.g., `https://word-chain-backend.railway.app`)

### Option B: Using Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Add environment variables
railway variables set DATABASE_URL="your_db_url"
railway variables set JWT_SECRET="your_secret"
# ... add other variables

# Deploy
railway up
```

## Step 3: Deploy Frontend to Vercel

### Option A: Using Vercel Dashboard

1. Go to [Vercel.com](https://vercel.com)
2. Click "New Project" → "Import Git Repository"
3. Select your `word-chain-duel` repository
4. Configure project settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `./client`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`

5. Add environment variables:
   - `VITE_FRONTEND_FORGE_API_URL`: Manus API URL
   - `VITE_FRONTEND_FORGE_API_KEY`: Manus API key
   - `VITE_OAUTH_PORTAL_URL`: OAuth portal URL
   - `VITE_APP_ID`: Your OAuth app ID
   - `VITE_ANALYTICS_ENDPOINT`: Analytics endpoint
   - `VITE_ANALYTICS_WEBSITE_ID`: Analytics website ID
   - `VITE_API_URL`: Your Railway backend URL (e.g., `https://word-chain-backend.railway.app`)

6. Click "Deploy"
7. Vercel will build and deploy automatically
8. Note the generated URL (e.g., `https://word-chain-duel.vercel.app`)

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts to link your project
```

## Step 4: Configure Frontend API URL

After deploying the backend to Railway, update the frontend to point to the correct API URL:

### In `client/src/lib/trpc.ts`:

```typescript
const baseUrl = process.env.VITE_API_URL || 'https://your-railway-backend.railway.app';

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${baseUrl}/api/trpc`,
      // ... rest of config
    }),
  ],
});
```

Or set the `VITE_API_URL` environment variable in Vercel:
- Go to Project Settings → Environment Variables
- Add `VITE_API_URL`: `https://your-railway-backend.railway.app`

## Step 5: Set Up Database

### Option A: Railway Database

1. In Railway dashboard, click "New" → "Database" → "MySQL"
2. Railway will provision a MySQL database
3. Copy the `DATABASE_URL` connection string
4. Add it to your backend environment variables

### Option B: External Database

Use any MySQL/TiDB provider:
- Planetscale (https://planetscale.com)
- AWS RDS
- Google Cloud SQL
- DigitalOcean Managed Databases

## Step 6: Run Database Migrations

After setting up the database, run migrations on Railway:

```bash
# Connect to Railway
railway shell

# Run migrations
pnpm drizzle-kit migrate
```

Or use Railway's "Run Command" feature in the dashboard.

## Step 7: Verify Deployments

### Test Backend

```bash
curl https://your-railway-backend.railway.app/api/trpc/auth.me
```

### Test Frontend

Visit `https://your-vercel-frontend.vercel.app` and check:
- ✅ Landing page loads with Memphis design
- ✅ Sign-in button works
- ✅ Game creation works
- ✅ Game play works with real-time updates

## Environment Variables Reference

### Backend (Railway)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | `mysql://user:pass@host/db` |
| `JWT_SECRET` | Session signing secret | Random 32+ char string |
| `NODE_ENV` | Environment | `production` |
| `VITE_APP_ID` | OAuth app ID | From Manus dashboard |
| `OAUTH_SERVER_URL` | OAuth server URL | `https://api.manus.im` |
| `OWNER_OPEN_ID` | Owner's OpenID | From Manus |
| `OWNER_NAME` | Owner's name | Your name |
| `BUILT_IN_FORGE_API_URL` | Manus API URL | `https://api.manus.im` |
| `BUILT_IN_FORGE_API_KEY` | Manus API key | From Manus dashboard |

### Frontend (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://your-railway-backend.railway.app` |
| `VITE_FRONTEND_FORGE_API_URL` | Manus API URL | `https://api.manus.im` |
| `VITE_FRONTEND_FORGE_API_KEY` | Manus API key | From Manus dashboard |
| `VITE_OAUTH_PORTAL_URL` | OAuth portal URL | From Manus |
| `VITE_APP_ID` | OAuth app ID | From Manus dashboard |
| `VITE_ANALYTICS_ENDPOINT` | Analytics endpoint | From Manus |
| `VITE_ANALYTICS_WEBSITE_ID` | Analytics website ID | From Manus |

## Troubleshooting

### Backend won't start on Railway

1. Check logs: `railway logs`
2. Verify environment variables are set
3. Ensure database connection string is correct
4. Check Node version compatibility (should be 18+)

### Frontend can't connect to backend

1. Verify `VITE_API_URL` is set correctly in Vercel
2. Check CORS settings on Railway backend
3. Ensure Railway backend is running: `curl https://your-backend.railway.app/api/trpc/auth.me`
4. Check browser console for API errors

### Database migrations fail

1. Ensure `DATABASE_URL` is correct
2. Run migrations manually: `pnpm drizzle-kit migrate`
3. Check database user permissions
4. Verify database is accessible from Railway

## Custom Domain Setup

### Railway Backend

1. Go to Railway project settings
2. Click "Domains"
3. Add custom domain (e.g., `api.wordchain.com`)
4. Update DNS records as instructed

### Vercel Frontend

1. Go to Vercel project settings
2. Click "Domains"
3. Add custom domain (e.g., `wordchain.com`)
4. Update DNS records as instructed

## Monitoring & Logs

### Railway

- Dashboard: View real-time logs and metrics
- CLI: `railway logs --follow`
- Metrics: CPU, memory, network usage

### Vercel

- Dashboard: View build logs and analytics
- CLI: `vercel logs`
- Analytics: Page views, performance metrics

## Next Steps

1. ✅ Deploy backend to Railway
2. ✅ Deploy frontend to Vercel
3. ✅ Configure environment variables
4. ✅ Run database migrations
5. ✅ Test both deployments
6. ✅ Set up custom domains (optional)
7. ✅ Enable monitoring and alerts

## Support

For issues or questions:
- Railway docs: https://docs.railway.app
- Vercel docs: https://vercel.com/docs
- Project GitHub: Your repository URL
