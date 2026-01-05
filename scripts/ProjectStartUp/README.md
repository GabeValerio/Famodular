# 🚀 Project Startup Scripts

Complete deployment and maintenance scripts for Famodular.

## 📋 Scripts Overview

### Initial Setup (Run Once)
1. **`1_init-git.sh`** - Initialize Git repository and push to GitHub
2. **`2_clone-and-deploy.sh`** - Deploy application to server
3. **`3_setup-nginx.sh`** - Configure Nginx reverse proxy
4. **`4_enable-ssl.sh`** - Enable HTTPS with Let's Encrypt

### Maintenance & Monitoring
5. **`5_check-dns.sh`** - Check DNS configuration
6. **`6_health-check.sh`** - Comprehensive health check
7. **`7_deployment-status.sh`** - Show deployment status

### Quick Deploy (For Updates)
- **`deploy.sh`** - Quick deployment script for updates

---

## 🎯 Quick Start

### First Time Deployment

```bash
# 1. Configure environment variables
cp env.template env.production
# Edit env.production with your actual values

# 2. Run deployment scripts in order
./1_init-git.sh
./2_clone-and-deploy.sh
./3_setup-nginx.sh
./4_enable-ssl.sh
```

### Verify Deployment

```bash
# Check DNS
./5_check-dns.sh

# Health check
./6_health-check.sh

# Full status
./7_deployment-status.sh
```

---

## 📝 Script Details

### 1. Initialize Git (`1_init-git.sh`)
- Creates GitHub repository if it doesn't exist
- Initializes local Git repo
- Pushes code to GitHub

**When to use:** First time setup only

---

### 2. Clone and Deploy (`2_clone-and-deploy.sh`)
- Clones repository to server
- Installs dependencies
- Builds application
- Starts with PM2

**When to use:** 
- Initial deployment
- After making code changes

**Requirements:**
- `env.production` file must exist
- DNS should be configured (but not required for this step)

---

### 3. Setup Nginx (`3_setup-nginx.sh`)
- Creates Nginx configuration
- Sets up reverse proxy
- Enables site

**When to use:** After deployment, before SSL

**Requirements:**
- DNS must be configured and working
- App must be running on server

---

### 4. Enable SSL (`4_enable-ssl.sh`)
- Requests SSL certificate from Let's Encrypt
- Configures HTTPS
- Sets up auto-renewal

**When to use:** After Nginx is configured

**Requirements:**
- DNS must be working
- Nginx must be configured
- Port 80 must be accessible

---

### 5. Check DNS (`5_check-dns.sh`)
- Verifies DNS A records
- Checks HTTP/HTTPS accessibility
- Shows DNS status

**When to use:** 
- Before running Nginx setup
- If domain is not working
- To verify DNS propagation

**Example output:**
```
✅ Root domain points to correct IP: 24.144.69.238
✅ WWW subdomain points to correct IP: 24.144.69.238
✅ HTTPS is accessible (Status: 200)
🎉 DNS Configuration: PERFECT!
```

---

### 6. Health Check (`6_health-check.sh`)
- Checks PM2 process
- Verifies application is running
- Tests Nginx
- Checks HTTP/HTTPS
- Verifies SSL certificate
- Checks environment variables

**When to use:**
- After deployment
- When troubleshooting
- Regular maintenance checks

**Example output:**
```
✅ PM2 process 'Famodular.com' is running
✅ Application responds on port 3008
✅ Nginx is running and configured correctly
✅ Domain is accessible via HTTP
✅ Domain is accessible via HTTPS
🎉 Health Check: PERFECT!
```

---

### 7. Deployment Status (`7_deployment-status.sh`)
- Shows comprehensive deployment status
- Server information
- PM2 status
- Application status
- DNS status
- Nginx status
- SSL certificate info
- Environment variables

**When to use:**
- Quick status overview
- Debugging issues
- Documentation

---

## 🔄 Updating Your App

### Quick Update (Recommended)
```bash
./deploy.sh "Your commit message"
```

### Manual Update
```bash
# 1. Commit and push changes
git add .
git commit -m "Your changes"
git push

# 2. Deploy to server
./2_clone-and-deploy.sh
```

---

## 🐛 Troubleshooting

### DNS Not Working?
```bash
./5_check-dns.sh
```
- Check DNS records at your registrar
- Wait for DNS propagation (can take up to 48 hours)
- Verify A records point to: `24.144.69.238`

### App Not Running?
```bash
./6_health-check.sh
```
- Check PM2 logs: `ssh root@24.144.69.238 'pm2 logs Famodular.com'`
- Restart app: `ssh root@24.144.69.238 'pm2 restart Famodular.com'`

### SSL Issues?
- Make sure DNS is working first
- Check port 80 is open: `ufw allow 80 && ufw allow 443`
- Re-run: `./4_enable-ssl.sh`

### Environment Variables Not Working?
- Verify `.env.local` exists on server: `ssh root@24.144.69.238 'ls -la /root/Famodular.com/.env.local'`
- Check variables: `ssh root@24.144.69.238 'cat /root/Famodular.com/.env.local'`
- Restart app after changes: `ssh root@24.144.69.238 'pm2 restart Famodular.com'`

---

## 📚 Additional Resources

- **DNS Setup Guide:** See `DNS_SETUP.md`
- **Deployment Guide:** See `DEPLOYMENT_GUIDE.md`
- **DNS Check Guide:** See `CHECK_DNS.md`

---

## ⚙️ Configuration

Edit `config.env.project` to change:
- Project name
- Domain
- Port
- Server IP
- GitHub URL

---

## 🔒 Security Notes

- Never commit `env.production` to Git
- Keep `.env.local` secure on server
- SSL certificates auto-renew via Certbot
- PM2 process runs with appropriate permissions

---

## 📞 Quick Commands

```bash
# Check everything
./7_deployment-status.sh

# Quick health check
./6_health-check.sh

# Check DNS only
./5_check-dns.sh

# View logs
ssh root@24.144.69.238 'pm2 logs Famodular.com'

# Restart app
ssh root@24.144.69.238 'pm2 restart Famodular.com'

# Check PM2 status
ssh root@24.144.69.238 'pm2 list'
```

---

**Last Updated:** After successful deployment
**Status:** ✅ All scripts tested and working







