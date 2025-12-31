# 🚀 Famodular Deployment Guide

This guide will walk you through making your app live and connecting your domain name to it.

## 📋 Prerequisites Checklist

Before you begin, make sure you have:

- [ ] **Domain name** (e.g., `famodular.com`) - purchased from a domain registrar (GoDaddy, Namecheap, Google Domains, etc.)
- [ ] **Server** - Your Digital Ocean droplet/server is running at IP: `24.144.69.238`
- [ ] **SSH access** to your server configured
- [ ] **GitHub repository** - Your code is on GitHub at `git@github.com:GabeValerio/Famodular.git`
- [ ] **All environment variables** configured (see below)

---

## 🌐 Step 1: Configure DNS (MAKE DOMAIN POINT TO YOUR SERVER)

This is the step that makes your domain name point to your app!

### Option A: Using Your Domain Registrar's DNS Panel

1. **Log into your domain registrar** (where you bought `famodular.com`)
   - Common registrars: GoDaddy, Namecheap, Google Domains, Cloudflare, etc.

2. **Find DNS Management**
   - Look for "DNS Settings", "DNS Management", "Name Servers", or "DNS Records"

3. **Add/Update DNS Records:**
   
   Add these **A Records**:
   ```
   Type: A
   Name: @ (or leave blank, or use your domain)
   Value: 24.144.69.238
   TTL: 3600 (or default)
   
   Type: A
   Name: www
   Value: 24.144.69.238
   TTL: 3600 (or default)
   ```

4. **Save the changes**

5. **Wait for DNS propagation** (5 minutes to 48 hours, usually 15-30 minutes)
   - Check if it worked: Run `nslookup famodular.com` or `dig famodular.com`
   - You should see `24.144.69.238` in the response

### Option B: Using Cloudflare (Recommended)

1. **Add your domain to Cloudflare** (free)
2. **Update nameservers** at your registrar to Cloudflare's nameservers
3. **Add A Records** in Cloudflare:
   - `@` → `24.144.69.238`
   - `www` → `24.144.69.238`
4. **Enable proxy** (orange cloud) for automatic DDoS protection

---

## 📝 Step 2: Prepare Environment Variables

Create the production environment file:

```bash
cd scripts/ProjectStartUp
cp config.env.project env.production
```

**Edit `env.production`** and fill in all the real values (currently has placeholders):

```bash
# Required values to update:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
NEXTAUTH_SECRET=generate_with: openssl rand -base64 32
NEXT_PUBLIC_BASE_URL=https://famodular.com

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_actual_key
CLOUDINARY_API_SECRET=your_actual_secret

NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key
```

**Important:** Make sure `NEXT_PUBLIC_BASE_URL` matches your actual domain!

---

## 🔧 Step 3: Verify Server Setup

Make sure your server has:
- Node.js installed (`node --version`)
- npm installed (`npm --version`)
- PM2 installed (`npm install -g pm2`)
- Nginx installed (`nginx -v`)
- Certbot installed (`certbot --version`)

If missing, install them:
```bash
ssh root@24.144.69.238
# Install Node.js (if needed)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Install Nginx
apt-get update
apt-get install -y nginx

# Install Certbot
apt-get install -y certbot python3-certbot-nginx
```

---

## 🚀 Step 4: Deploy Your Application

Run the scripts in order:

### Step 4.1: Initialize Git (if not already done)
```bash
cd scripts/ProjectStartUp
chmod +x *.sh
./1_init-git.sh
```

### Step 4.2: Deploy to Server
```bash
./2_clone-and-deploy.sh
```

This will:
- Clone your repo to the server
- Install dependencies
- Build your Next.js app
- Start it with PM2 on port 3008

### Step 4.3: Configure Nginx (After DNS is pointing to server)
**Wait until DNS is working first!** Then run:

```bash
./3_setup-nginx.sh
```

This configures Nginx to:
- Listen on port 80 (HTTP)
- Reverse proxy to your app on port 3008
- Handle both `famodular.com` and `www.famodular.com`

### Step 4.4: Enable SSL (HTTPS)
```bash
./4_enable-ssl.sh
```

This will:
- Request free SSL certificate from Let's Encrypt
- Automatically configure HTTPS
- Redirect HTTP to HTTPS

---

## ✅ Verification Steps

After deployment, verify everything works:

1. **Check DNS is pointing correctly:**
   ```bash
   nslookup famodular.com
   # Should show: 24.144.69.238
   ```

2. **Check app is running on server:**
   ```bash
   ssh root@24.144.69.238
   pm2 list
   # Should show your app running
   curl http://localhost:3008
   # Should return your app
   ```

3. **Check Nginx is working:**
   ```bash
   ssh root@24.144.69.238
   nginx -t
   systemctl status nginx
   ```

4. **Test your domain:**
   - Visit `http://famodular.com` (should work)
   - Visit `https://famodular.com` (should work after SSL)
   - Visit `https://www.famodular.com` (should work)

---

## 🔄 Updating Your App (Future Deployments)

After initial setup, you can update your app using the `deploy.sh` script:

```bash
cd scripts/ProjectStartUp
./deploy.sh "Your commit message"
```

Or manually:
```bash
# Push to GitHub
git add .
git commit -m "Update message"
git push

# SSH to server and pull
ssh root@24.144.69.238
cd /root/Famodular.com
git pull
npm install
npm run build
pm2 restart Famodular.com
```

---

## 🐛 Troubleshooting

### Domain not resolving?
- Wait longer (DNS can take up to 48 hours)
- Check DNS records at your registrar
- Use `dig famodular.com` or `nslookup famodular.com` to verify

### SSL certificate fails?
- Make sure DNS is working first
- Check that port 80 is open: `ufw allow 80 && ufw allow 443`
- Verify domain is accessible via HTTP before requesting SSL

### App not starting?
- Check PM2 logs: `pm2 logs Famodular.com`
- Verify environment variables: `ssh root@24.144.69.238` then `cat /root/.env.famodular`
- Check if port 3008 is in use: `lsof -i :3008`

### Nginx errors?
- Test config: `nginx -t`
- Check logs: `tail -f /var/log/nginx/error.log`
- Make sure Nginx is running: `systemctl status nginx`

---

## 📚 Additional Resources

- [Digital Ocean DNS Guide](https://www.digitalocean.com/community/tutorials/how-to-point-to-digitalocean-nameservers-from-common-domain-registrars)
- [Nginx Reverse Proxy Guide](https://www.nginx.com/blog/nginx-nodejs-websockets-socketio/)
- [Let's Encrypt Certbot Guide](https://certbot.eff.org/)

---

## 🎯 Quick Start Checklist

```
[ ] Domain purchased
[ ] DNS A records configured (@ and www → 24.144.69.238)
[ ] DNS propagation verified (nslookup works)
[ ] env.production file created and filled in
[ ] Server has Node.js, PM2, Nginx, Certbot installed
[ ] Run ./1_init-git.sh
[ ] Run ./2_clone-and-deploy.sh
[ ] Run ./3_setup-nginx.sh
[ ] Run ./4_enable-ssl.sh
[ ] Test https://famodular.com ✅
```

---

Good luck! 🚀





