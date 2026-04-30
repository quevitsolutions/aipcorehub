#!/bin/bash
# ═══════════════════════════════════════════════════════
#  AIPCore VPS Deploy Script
#  Target: 86.107.77.240
#  Usage:  bash deploy.sh [ssh-user] 
#          Default user: root
# ═══════════════════════════════════════════════════════

VPS_IP="86.107.77.240"
VPS_USER="${1:-root}"
DEPLOY_DIR="/opt/aipcore"
REPO_URL="https://github.com/quevitsolutions/aipcorehub"
BRANCH="main"

echo "🚀 Deploying AIPCore to $VPS_USER@$VPS_IP ..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_IP" bash << REMOTE
  set -e

  echo "📦 Checking Docker & Git..."
  which docker > /dev/null || { echo "❌ Docker not found on VPS"; exit 1; }
  which git > /dev/null    || { echo "❌ Git not found on VPS"; exit 1; }

  # Clone or pull latest code
  if [ -d "$DEPLOY_DIR/.git" ]; then
    echo "📥 Pulling latest code from GitHub ($BRANCH)..."
    cd $DEPLOY_DIR
    git fetch origin
    git reset --hard origin/$BRANCH
  else
    echo "📥 Cloning repository..."
    mkdir -p $DEPLOY_DIR
    git clone --branch $BRANCH $REPO_URL $DEPLOY_DIR
    cd $DEPLOY_DIR
  fi

  echo "✅ Code updated: \$(git log -1 --oneline)"

  # Ensure .env exists on VPS
  if [ ! -f "$DEPLOY_DIR/.env" ]; then
    echo "⚠️  WARNING: No .env file found at $DEPLOY_DIR/.env"
    echo "    Please create it with your production environment variables."
    echo "    Continuing with existing container env (if any)..."
  fi

  cd $DEPLOY_DIR

  echo ""
  echo "🐳 Rebuilding Docker containers (no cache)..."
  docker compose down --remove-orphans
  docker compose build --no-cache
  docker compose up -d

  echo ""
  echo "⏳ Waiting for services to start..."
  sleep 8

  echo ""
  echo "📊 Container status:"
  docker compose ps

  echo ""
  echo "🏥 Health check (API):"
  curl -sf http://localhost:3001/health && echo "✅ API healthy" || echo "⚠️  API health check failed (may still be starting)"

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ Deploy complete! Site: https://aipcore.online"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
REMOTE
