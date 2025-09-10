# Supabase Database Connection Fix Guide

## 1. Check Supabase Dashboard Settings

### Go to Supabase Dashboard:
1. Visit https://supabase.com/dashboard
2. Select your project: `svolcabvxuvvsidwxmwf`
3. Go to **Settings** → **Database**

### Check Network Restrictions:
- Look for **"Network Restrictions"** or **"IP Allow List"**
- If you see IP restrictions, either:
  - **Option A**: Add `0.0.0.0/0` to allow all IPs (less secure)
  - **Option B**: Add your specific IP address

### Enable Connection Pooling:
- Go to **Settings** → **Database** → **Connection Pooling**
- Make sure **Connection Pooling** is **ENABLED**
- Use the **pooled connection string** instead of direct connection

## 2. Alternative Connection Strings to Try

Try these URLs in order of preference:

### Connection Pooler (Port 6543):
```
postgresql://postgres:NuKind123%23%24%25@db.svolcabvxuvvsidwxmwf.supabase.co:6543/postgres
```

### Direct Connection with SSL:
```
postgresql://postgres:NuKind123%23%24%25@db.svolcabvxuvvsidwxmwf.supabase.co:5432/postgres?sslmode=require
```

### Connection Pooler with SSL:
```
postgresql://postgres:NuKind123%23%24%25@db.svolcabvxuvvsidwxmwf.supabase.co:6543/postgres?sslmode=require
```

## 3. Verify Your Database Password

The current password appears to be: `NuKind123#$%`
- If this is incorrect, update it in Supabase Dashboard
- Go to **Settings** → **Database** → **Reset database password**

## 4. Test From Different Environment

If the above doesn't work, try from:
- **Your local machine** (where you have unrestricted internet)
- **Different network** (mobile hotspot, different WiFi)
- **Production deployment** (Vercel, Netlify, etc.)