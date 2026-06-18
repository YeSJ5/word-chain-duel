#!/bin/bash

# Word Chain Duel - Deployment Setup Script
# This script helps prepare the project for deployment to Railway and Vercel

set -e

echo "🎮 Word Chain Duel - Deployment Setup"
echo "======================================"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm is not installed. Installing pnpm..."
    npm install -g pnpm
fi

echo "✅ Prerequisites check passed"
echo ""

# Initialize git if needed
if [ ! -d .git ]; then
    echo "📦 Initializing Git repository..."
    git init
    git config user.email "deploy@wordchain.local"
    git config user.name "Word Chain Deploy"
fi

echo "✅ Git repository ready"
echo ""

# Install dependencies
echo "📥 Installing dependencies..."
pnpm install
echo "✅ Dependencies installed"
echo ""

# Build the project
echo "🔨 Building project..."
pnpm build
echo "✅ Project built successfully"
echo ""

# Run tests
echo "🧪 Running tests..."
pnpm test
echo "✅ All tests passed"
echo ""

# Create .env.example if it doesn't exist
if [ ! -f .env.example ]; then
    echo "📝 Creating .env.example..."
    cat > .env.example << 'EOF'
# Database
DATABASE_URL=mysql://user:password@host:3306/wordchain

# Authentication
JWT_SECRET=your-secret-key-here-min-32-characters
VITE_APP_ID=your-oauth-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im

# Owner Info
OWNER_OPEN_ID=your-owner-id
OWNER_NAME=Your Name

# Manus API
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-frontend-api-key

# Analytics
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=your-website-id

# Frontend API URL (for Vercel)
VITE_API_URL=https://your-railway-backend.railway.app

# Environment
NODE_ENV=production
EOF
    echo "✅ .env.example created"
fi

echo ""
echo "🚀 Deployment Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Create a GitHub repository and push your code:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/word-chain-duel.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "2. Deploy backend to Railway:"
echo "   - Go to https://railway.app"
echo "   - Create new project from GitHub"
echo "   - Select this repository"
echo "   - Add environment variables from .env.example"
echo ""
echo "3. Deploy frontend to Vercel:"
echo "   - Go to https://vercel.com"
echo "   - Import this GitHub repository"
echo "   - Set root directory to 'client'"
echo "   - Add environment variables"
echo ""
echo "4. Read DEPLOYMENT.md for detailed instructions"
echo ""
echo "📚 Documentation: See DEPLOYMENT.md for complete guide"
echo ""
