#!/bin/bash
# DNS Configuration Checker
# Verifies that DNS is properly configured for your domain

set -e

source "$(dirname "$0")/config.env.project"

echo "🌐 Checking DNS Configuration for $DOMAIN..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check root domain
echo "📋 Checking root domain ($DOMAIN)..."
ROOT_IP=$(dig +short $DOMAIN | tail -1)

if [ "$ROOT_IP" = "$SERVER_IP" ]; then
    echo -e "${GREEN}✅ Root domain points to correct IP: $ROOT_IP${NC}"
else
    echo -e "${RED}❌ Root domain points to: $ROOT_IP (expected: $SERVER_IP)${NC}"
fi

# Check www subdomain
echo ""
echo "📋 Checking www subdomain (www.$DOMAIN)..."
WWW_IP=$(dig +short www.$DOMAIN | tail -1)

if [ "$WWW_IP" = "$SERVER_IP" ]; then
    echo -e "${GREEN}✅ WWW subdomain points to correct IP: $WWW_IP${NC}"
else
    echo -e "${RED}❌ WWW subdomain points to: $WWW_IP (expected: $SERVER_IP)${NC}"
fi

# Check HTTP accessibility
echo ""
echo "📋 Checking HTTP accessibility..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN || echo "000")

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ]; then
    echo -e "${GREEN}✅ HTTP is accessible (Status: $HTTP_STATUS)${NC}"
else
    echo -e "${YELLOW}⚠️  HTTP returned status: $HTTP_STATUS${NC}"
fi

# Check HTTPS accessibility
echo ""
echo "📋 Checking HTTPS accessibility..."
HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN || echo "000")

if [ "$HTTPS_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ HTTPS is accessible (Status: $HTTPS_STATUS)${NC}"
elif [ "$HTTPS_STATUS" = "000" ]; then
    echo -e "${RED}❌ HTTPS is not accessible (connection failed)${NC}"
    echo "   Run ./4_enable-ssl.sh to set up SSL"
else
    echo -e "${YELLOW}⚠️  HTTPS returned status: $HTTPS_STATUS${NC}"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$ROOT_IP" = "$SERVER_IP" ] && [ "$WWW_IP" = "$SERVER_IP" ] && [ "$HTTPS_STATUS" = "200" ]; then
    echo -e "${GREEN}🎉 DNS Configuration: PERFECT!${NC}"
    echo "   Your domain is fully configured and accessible via HTTPS."
elif [ "$ROOT_IP" = "$SERVER_IP" ] && [ "$WWW_IP" = "$SERVER_IP" ]; then
    echo -e "${YELLOW}⚠️  DNS Configuration: GOOD (but HTTPS needs setup)${NC}"
    echo "   DNS is correct, but HTTPS is not working."
    echo "   Run: ./4_enable-ssl.sh"
else
    echo -e "${RED}❌ DNS Configuration: NEEDS ATTENTION${NC}"
    echo "   Please check your DNS settings at your domain registrar."
    echo "   Both @ and www should point to: $SERVER_IP"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"




