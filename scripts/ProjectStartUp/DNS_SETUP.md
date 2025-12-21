# 🌐 DNS Setup - Make Your Domain Point to Your App

This is the **most important step** to make your domain name work!

## Quick Answer: How to Point Domain to Your App

Your domain (`famodular.com`) needs to point to your server IP: **24.144.69.238**

## Step-by-Step Instructions

### 1. Log into Your Domain Registrar
Where did you buy `famodular.com`? Common places:
- GoDaddy
- Namecheap
- Google Domains
- Cloudflare
- Domain.com

### 2. Find DNS Management
Look for one of these:
- "DNS Settings"
- "DNS Management" 
- "Manage DNS"
- "DNS Records"
- "Advanced DNS"

### 3. Add Two A Records

Add these exact records:

**Record 1: Root Domain**
```
Type: A
Host/Name: @ (or blank, or famodular.com)
Points to: 24.144.69.238
TTL: 3600 (or Auto/Default)
```

**Record 2: WWW Subdomain**
```
Type: A
Host/Name: www
Points to: 24.144.69.238
TTL: 3600 (or Auto/Default)
```

### 4. Save Changes
Click "Save" or "Add Record"

### 5. Wait & Verify

**Wait:** DNS changes take 5 minutes to 48 hours (usually 15-30 minutes)

**Verify it worked:**
```bash
# In your terminal:
nslookup famodular.com

# Should show:
# Name: famodular.com
# Address: 24.144.69.238
```

Or visit: https://www.whatsmydns.net/#A/famodular.com

## Visual Example (GoDaddy)

```
Type: A
Name: @
Value: 24.144.69.238
TTL: 600 seconds
        [Save]

Type: A  
Name: www
Value: 24.144.69.238
TTL: 600 seconds
        [Save]
```

## What Happens Next?

1. ✅ DNS configured → Domain points to your server IP
2. ✅ Deploy app → Your scripts deploy code to server
3. ✅ Configure Nginx → Server forwards domain to your app
4. ✅ Add SSL → HTTPS encryption enabled
5. 🎉 Visit `https://famodular.com` → Your app is live!

## Common Issues

**"Domain not working"**
- Wait longer (DNS propagation takes time)
- Double-check the IP: `24.144.69.238`
- Make sure you added both `@` and `www` records

**"Different registrar, different interface"**
- Look for "A Record" or "DNS Record"
- Set Name/Host to `@` or blank for root domain
- Set Name/Host to `www` for www subdomain
- Point both to `24.144.69.238`

## Need Help?

If you're stuck:
1. Check your registrar's help docs for "How to add A record"
2. Verify the server IP is correct: `24.144.69.238`
3. Use `nslookup famodular.com` to check if DNS has propagated


