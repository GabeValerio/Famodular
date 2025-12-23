# 🌐 How to Check DNS Propagation

DNS propagation can take anywhere from a few minutes to 48 hours, though it's usually 15-30 minutes. Here's how to verify your domain is pointing to your server.

## Quick Check (Terminal)

### Method 1: Using `nslookup`

```bash
nslookup famodular.com
```

**What to look for:**
- You should see an "Address" line showing: `24.144.69.238`
- If you see a different IP or no address, DNS hasn't propagated yet

**Example of good output:**
```
Server:		8.8.8.8
Address:	8.8.8.8#53

Non-authoritative answer:
Name:	famodular.com
Address: 24.144.69.238
```

### Method 2: Using `dig` (more detailed)

```bash
dig famodular.com +short
```

**Expected output:**
```
24.144.69.238
```

Or for more details:
```bash
dig famodular.com
```

### Method 3: Using `host` command

```bash
host famodular.com
```

**Expected output:**
```
famodular.com has address 24.144.69.238
```

## Online Tools (Recommended)

### 1. **What's My DNS** (Best for checking multiple locations)
Visit: https://www.whatsmydns.net/#A/famodular.com

This shows DNS propagation status from servers around the world. You'll see:
- ✅ Green checkmarks = DNS has propagated to that location
- ⏳ Loading/Clock icons = Still propagating
- ❌ Red X = Not propagated yet

**What to look for:** When most or all locations show `24.144.69.238`, you're good!

### 2. **DNS Checker**
Visit: https://dnschecker.org/#A/famodular.com

Similar to What's My DNS, shows propagation status globally.

### 3. **MXToolbox**
Visit: https://mxtoolbox.com/DNSLookup.aspx?Type=A&Domain=famodular.com

Shows DNS records and response times.

## Testing Both Root and WWW

Check both your root domain AND www subdomain:

```bash
# Root domain
nslookup famodular.com

# WWW subdomain  
nslookup www.famodular.com
```

Both should return: `24.144.69.238`

## When DNS is Ready

✅ **You can proceed with deployment when:**
- `nslookup famodular.com` shows `24.144.69.238`
- `nslookup www.famodular.com` shows `24.144.69.238`
- Online tools show the IP at most global locations

## Troubleshooting

### Still showing old IP or no IP?

1. **Wait longer** - Can take up to 48 hours (rare)
2. **Check your DNS settings** at your registrar:
   - Make sure A records are correct
   - Verify @ (root) and www both point to `24.144.69.238`
   - Check TTL settings (lower = faster updates)
3. **Clear your local DNS cache:**
   ```bash
   # macOS
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   
   # Linux
   sudo systemd-resolve --flush-caches
   
   # Windows
   ipconfig /flushdns
   ```

### Different IP showing?

- If you see a different IP, your DNS records might be wrong at your registrar
- Double-check the A records point to exactly: `24.144.69.238`

## Pro Tip

Once DNS is working, you can test HTTP access:

```bash
curl -I http://famodular.com
```

If DNS is working but Nginx isn't set up yet, you'll get a connection error (that's normal). Once you run script 3 (Nginx setup), this should return an HTTP response.



