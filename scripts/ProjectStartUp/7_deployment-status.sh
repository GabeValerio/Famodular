#!/bin/bash
# Deployment Status Script
# Shows comprehensive status of your deployment

set -e

source "$(dirname "$0")/config.env.project"

echo "📊 Deployment Status for $PROJECT_NAME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Server Info
echo -e "${CYAN}🖥️  Server Information:${NC}"
echo "   IP Address: $SERVER_IP"
echo "   Domain: $DOMAIN"
echo "   Port: $PORT"
echo ""

# PM2 Status
echo -e "${CYAN}⚙️  PM2 Process Status:${NC}"
ssh root@$SERVER_IP "pm2 list | grep '$DOMAIN' || echo '   Process not found'" 2>/dev/null || echo "   Could not connect to server"
echo ""

# Application Status
echo -e "${CYAN}🚀 Application Status:${NC}"
LOCAL_STATUS=$(ssh root@$SERVER_IP "curl -s -o /dev/null -w '%{http_code}' http://localhost:$PORT" 2>/dev/null || echo "000")
if [ "$LOCAL_STATUS" = "200" ]; then
    echo -e "   Local (port $PORT): ${GREEN}✅ Running${NC}"
else
    echo -e "   Local (port $PORT): ${RED}❌ Not responding (Status: $LOCAL_STATUS)${NC}"
fi

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ]; then
    echo -e "   HTTP: ${GREEN}✅ Accessible${NC}"
else
    echo -e "   HTTP: ${RED}❌ Not accessible (Status: $HTTP_STATUS)${NC}"
fi

HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN 2>/dev/null || echo "000")
if [ "$HTTPS_STATUS" = "200" ]; then
    echo -e "   HTTPS: ${GREEN}✅ Accessible${NC}"
else
    echo -e "   HTTPS: ${YELLOW}⚠️  Not accessible (Status: $HTTPS_STATUS)${NC}"
fi
echo ""

# DNS Status
echo -e "${CYAN}🌐 DNS Status:${NC}"
ROOT_IP=$(dig +short $DOMAIN 2>/dev/null | tail -1 || echo "unknown")
if [ "$ROOT_IP" = "$SERVER_IP" ]; then
    echo -e "   Root domain: ${GREEN}✅ $ROOT_IP${NC}"
else
    echo -e "   Root domain: ${RED}❌ $ROOT_IP (expected: $SERVER_IP)${NC}"
fi

WWW_IP=$(dig +short www.$DOMAIN 2>/dev/null | tail -1 || echo "unknown")
if [ "$WWW_IP" = "$SERVER_IP" ]; then
    echo -e "   WWW subdomain: ${GREEN}✅ $WWW_IP${NC}"
else
    echo -e "   WWW subdomain: ${RED}❌ $WWW_IP (expected: $SERVER_IP)${NC}"
fi
echo ""

# Nginx Status
echo -e "${CYAN}🌐 Nginx Status:${NC}"
NGINX_RUNNING=$(ssh root@$SERVER_IP "systemctl is-active nginx 2>/dev/null || echo 'inactive'" 2>/dev/null || echo "unknown")
if [ "$NGINX_RUNNING" = "active" ]; then
    echo -e "   Service: ${GREEN}✅ Running${NC}"
else
    echo -e "   Service: ${RED}❌ $NGINX_RUNNING${NC}"
fi

NGINX_CONFIG=$(ssh root@$SERVER_IP "nginx -t 2>&1 | grep -q 'successful' && echo 'valid' || echo 'invalid'" 2>/dev/null || echo "unknown")
if [ "$NGINX_CONFIG" = "valid" ]; then
    echo -e "   Configuration: ${GREEN}✅ Valid${NC}"
else
    echo -e "   Configuration: ${RED}❌ Invalid${NC}"
fi
echo ""

# SSL Status
echo -e "${CYAN}🔐 SSL Certificate Status:${NC}"
SSL_EXISTS=$(ssh root@$SERVER_IP "test -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem && echo 'exists' || echo 'missing'" 2>/dev/null || echo "unknown")
if [ "$SSL_EXISTS" = "exists" ]; then
    echo -e "   Certificate: ${GREEN}✅ Installed${NC}"
    SSL_EXPIRY=$(ssh root@$SERVER_IP "openssl x509 -enddate -noout -in /etc/letsencrypt/live/$DOMAIN/fullchain.pem 2>/dev/null | cut -d= -f2 || echo 'unknown'" 2>/dev/null || echo "unknown")
    echo "   Expires: $SSL_EXPIRY"
else
    echo -e "   Certificate: ${YELLOW}⚠️  Not installed${NC}"
fi
echo ""

# Environment Variables
echo -e "${CYAN}🔧 Environment Variables:${NC}"
ENV_EXISTS=$(ssh root@$SERVER_IP "test -f /root/Famodular.com/.env.local && echo 'exists' || echo 'missing'" 2>/dev/null || echo "unknown")
if [ "$ENV_EXISTS" = "exists" ]; then
    echo -e "   .env.local: ${GREEN}✅ Present${NC}"
    SUPABASE=$(ssh root@$SERVER_IP "grep -q 'NEXT_PUBLIC_SUPABASE_URL' /root/Famodular.com/.env.local && echo 'configured' || echo 'missing'" 2>/dev/null || echo "unknown")
    if [ "$SUPABASE" = "configured" ]; then
        echo -e "   Supabase: ${GREEN}✅ Configured${NC}"
    else
        echo -e "   Supabase: ${RED}❌ Missing${NC}"
    fi
else
    echo -e "   .env.local: ${RED}❌ Missing${NC}"
fi
echo ""

# Quick Links
echo -e "${CYAN}🔗 Quick Links:${NC}"
echo "   🌐 Live Site: https://$DOMAIN"
echo "   📊 PM2 Dashboard: ssh root@$SERVER_IP 'pm2 monit'"
echo "   📝 View Logs: ssh root@$SERVER_IP 'pm2 logs $DOMAIN'"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"




