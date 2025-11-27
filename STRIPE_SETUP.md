# Stripe API Key Setup Guide

## Quick Answer: For Localhost Development

**The Stripe API key is the same for localhost and production!** The key difference is:
- **Test mode keys** (`sk_test_...`) → Use for localhost development
- **Live mode keys** (`sk_live_...`) → Use for production (real payments)

You get both from the same place: **Stripe Dashboard**.

## Getting Your Stripe API Keys

### Step 1: Access Stripe Dashboard

1. Go to: **https://dashboard.stripe.com/**
2. Log in (or create a free account if you don't have one)

### Step 2: Get Your Test API Key (For Localhost)

1. **Make sure you're in Test mode:**
   - Look at the top right of the dashboard
   - You should see a toggle that says "Test mode" (it should be ON/blue)
   - If it says "Live mode", click it to switch to Test mode

2. **Navigate to API Keys:**
   - Click **"Developers"** in the left sidebar
   - Click **"API keys"** (or go directly to: https://dashboard.stripe.com/test/apikeys)

3. **Copy your Secret key:**
   - Find the section labeled **"Secret key"** (it starts with `sk_test_...`)
   - Click **"Reveal test key"** button
   - Click **"Copy"** to copy the entire key
   - **Important:** Copy the entire key - it's very long!

### Step 3: Get Your Live API Key (For Production - Later)

When you're ready for production:
1. Switch to **Live mode** (toggle in top right)
2. Go to **Developers → API keys**
3. Copy the **Secret key** (starts with `sk_live_...`)

### Step 4: Update Your .env File

1. **Open your `.env` file** in the project root directory
2. **Paste your test key:**

```env
# For Localhost Development (Test Mode)
STRIPE_SECRET_KEY=sk_test_51ABC...paste_your_full_key_here...xyz

# For Production (when ready - comment out test key and uncomment this)
# STRIPE_SECRET_KEY=sk_live_51ABC...your_live_key_here...xyz
```

**Important Notes:**
- ✅ Use **test keys** (`sk_test_...`) for localhost - they won't charge real money
- ✅ The key should be on ONE line (no line breaks)
- ✅ No spaces before or after the key
- ✅ Copy the ENTIRE key (they're about 100+ characters long)

### Step 5: Restart Your Server

After updating the `.env` file:

1. **Stop your server** (if running):
   - Press `Ctrl+C` in the terminal where the server is running

2. **Restart the server:**
   ```bash
   npm start
   # or
   npm run dev
   ```

### Step 6: Verify It Works

The server should start without errors. You should see:
```
✅ Environment variables validated
Server running on http://localhost:3001
```

### Step 7: Test with Stripe CLI

Now you can run the webhook listener:

```bash
stripe listen --forward-to localhost:3001/api/webhook
```

**If you still get "API key expired" error:**
- Make sure you copied the ENTIRE key from Stripe Dashboard
- Check that there are no extra spaces in your `.env` file
- Try getting a fresh key: In Stripe Dashboard → Developers → API keys → Click "..." → "Roll key"

## Visual Guide: Where to Find Your API Key

1. **Go to:** https://dashboard.stripe.com/test/apikeys
2. **You'll see:**
   ```
   Publishable key: pk_test_...
   Secret key:      sk_test_... [Reveal test key]
   ```
3. **Click "Reveal test key"** → Copy the entire key

## Common Issues

### "API Key Expired" Error

**Solution:**
1. Go to Stripe Dashboard → Developers → API keys
2. Click the "..." menu next to your key
3. Click "Roll key" to create a new one
4. Copy the new key and update your `.env` file
5. Restart your server

### "Invalid API Key" Error

**Check:**
- ✅ Copied the entire key (they're 100+ characters long!)
- ✅ No extra spaces before/after the key in `.env`
- ✅ Key starts with `sk_test_` (for localhost) or `sk_live_` (production)
- ✅ Using Test mode key for localhost development
- ✅ Key is on one line (no line breaks)

### Test vs Live Keys - Quick Reference

| Key Type | Starts With | Use For | Charges Real Money? |
|----------|-------------|---------|-------------------|
| **Test** | `sk_test_...` | Localhost development | ❌ No |
| **Live** | `sk_live_...` | Production | ✅ Yes |

**⚠️ Always use test keys (`sk_test_...`) for localhost development!**

## Security Best Practices

1. **Never commit `.env` file to git**
   - Add `.env` to `.gitignore`
   
2. **Use different keys for test and production**
   - Test keys for development
   - Live keys only in production environment

3. **Rotate keys if compromised**
   - Go to Stripe Dashboard → Developers → API keys
   - Click "..." next to the key
   - Select "Roll key" to create a new one

## If Your Key is Expired (Roll a New One)

If you see "API key expired" error:

1. **In Stripe Dashboard** (https://dashboard.stripe.com/test/apikeys):
   - Find your "Secret key" row
   - Click the **"..."** (three dots) icon at the end of the row
   - Select **"Roll key"** from the menu
   - Confirm the action
   - A **new key** will be generated
   - Click **"Reveal test key"** and copy the new key

2. **Update your `.env` file:**
   - Replace the old `STRIPE_SECRET_KEY` value with the new key
   - Save the file

3. **Restart everything:**
   - Stop your server (Ctrl+C)
   - Restart server: `npm start` or `npm run dev`
   - Try Stripe CLI again: `stripe listen --forward-to localhost:3001/api/webhook`

**Note:** After rolling a key, the old key will stop working immediately. Make sure to update your `.env` file right away!

## Quick Checklist

- [ ] Logged into Stripe Dashboard
- [ ] In Test mode (for development)
- [ ] Copied Secret key (starts with `sk_test_...`)
- [ ] Updated `.env` file with new key
- [ ] Restarted server
- [ ] Server shows "✅ Environment variables validated"
- [ ] Stripe CLI works: `stripe listen --forward-to localhost:3001/api/webhook`

