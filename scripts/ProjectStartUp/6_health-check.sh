#!/bin/bash
# Health Check Script
# Verifies that all components of your deployment are working

set -e

source "$(dirname "$0")/config.env.project"

echo "🏥 Running Health Check for $PROJECT_NAME..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to check status
check_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        ERRORS=$((ERRORS + 1))
    fi
}

check_warning() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${YELLOW}⚠️  $2${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
}

# 1. Check PM2 Process
echo -e "${BLUE}[1/7]${NC} Checking PM2 Process..."
PM2_STATUS=$(ssh root@$SERVER_IP "pm2 list | grep '$DOMAIN' | grep -q 'online' && echo '0' || echo '1'" 2>/dev/null || echo "1")
check_status $PM2_STATUS "PM2 process '$DOMAIN' is running"

# 2. Check App on Port
echo -e "${BLUE}[2/7]${NC} Checking Application on Port $PORT..."
APP_STATUS=$(ssh root@$SERVER_IP "curl -s -o /dev/null -w '%{http_code}' http://localhost:$PORT" 2>/dev/null | grep -q "200\|301\|302" && echo "0" || echo "1")
check_status $APP_STATUS "Application responds on port $PORT"

# 3. Check Nginx
echo -e "${BLUE}[3/7]${NC} Checking Nginx..."
NGINX_STATUS=$(ssh root@$SERVER_IP "nginx -t > /dev/null 2>&1 && systemctl is-active --quiet nginx && echo '0' || echo '1'" 2>/dev/null || echo "1")
check_status $NGINX_STATUS "Nginx is running and configured correctly"

# 4. Check Domain HTTP
echo -e "${BLUE}[4/7]${NC} Checking Domain HTTP Access..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN 2>/dev/null | grep -q "200\|301\|302" && echo "0" || echo "1")
check_status $HTTP_STATUS "Domain is accessible via HTTP"

# 5. Check Domain HTTPS
echo -e "${BLUE}[5/7]${NC} Checking Domain HTTPS Access..."
HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN 2>/dev/null | grep -q "200" && echo "0" || echo "1")
check_warning $HTTPS_STATUS "Domain is accessible via HTTPS"

# 6. Check SSL Certificate
echo -e "${BLUE}[6/7]${NC} Checking SSL Certificate..."
SSL_STATUS=$(ssh root@$SERVER_IP "test -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem && echo '0' || echo '1'" 2>/dev/null || echo "1")
check_warning $SSL_STATUS "SSL certificate exists"

# 7. Check Environment Variables
echo -e "${BLUE}[7/7]${NC} Checking Environment Variables..."
ENV_STATUS=$(ssh root@$SERVER_IP "test -f /root/Famodular.com/.env.local && grep -q 'NEXT_PUBLIC_SUPABASE_URL' /root/Famodular.com/.env.local && echo '0' || echo '1'" 2>/dev/null || echo "1")
check_status $ENV_STATUS "Environment variables file exists and is configured"

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 Health Check: PERFECT!${NC}"
    echo "   All systems are operational."
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Health Check: GOOD (with $WARNINGS warning(s))${NC}"
    echo "   Core systems are working, but some optional features need attention."
else
    echo -e "${RED}❌ Health Check: ISSUES FOUND${NC}"
    echo "   Found $ERRORS error(s) and $WARNINGS warning(s)."
    echo "   Please review the issues above."
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exit $ERRORS




