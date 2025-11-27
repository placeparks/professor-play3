# Stripe Webhook Setup Guide

## Step-by-Step Instructions

### 1. Determine Your Webhook URL

Your webhook endpoint is:
```
http://localhost:3001/api/webhook
```

**For Local Development:**
- Use a tool like **ngrok** or **Stripe CLI** to expose your local server
- Or use Stripe's webhook testing feature

**For Production:**
- Replace `localhost:3001` with your actual domain
- Example: `https://yourdomain.com/api/webhook`

### 2. Using Stripe CLI (Recommended for Development)

The easiest way to test webhooks locally:

1. **Install Stripe CLI:**
   ```bash
   # Windows (using Scoop)
   scoop install stripe
   
   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe:**
   ```bash
   stripe login
   ```

3. **Forward webhooks to your local server:**
   ```bash
   stripe listen --forward-to localhost:3001/api/webhook
   ```

4. **Copy the webhook signing secret** that appears (starts with `whsec_...`)

5. **Add it to your `.env` file:**
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### 3. Using ngrok (Alternative for Development)

1. **Install ngrok:**
   - Download from: https://ngrok.com/download
   - Or: `npm install -g ngrok`

2. **Start your server:**
   ```bash
   npm start
   ```

3. **In another terminal, expose your local server:**
   ```bash
   ngrok http 3001
   ```

4. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

5. **Use this URL in Stripe Dashboard:**
   ```
   https://abc123.ngrok.io/api/webhook
   ```

### 4. Setting Up in Stripe Dashboard

1. **Go to Stripe Dashboard:**
   - Visit: https://dashboard.stripe.com/webhooks
   - Or: Dashboard → Developers → Webhooks

2. **Click "Add endpoint"**

3. **Enter your webhook URL:**
   - **Development (with ngrok):** `https://your-ngrok-url.ngrok.io/api/webhook`
   - **Production:** `https://yourdomain.com/api/webhook`

4. **Select events to listen for:**
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`

5. **Click "Add endpoint"**

6. **Copy the "Signing secret":**
   - Click on your webhook endpoint
   - Find "Signing secret" section
   - Click "Reveal" and copy the secret (starts with `whsec_...`)

7. **Add to your `.env` file:**
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### 5. Testing Your Webhook

1. **Make a test purchase** through your checkout

2. **Check your server logs** - you should see:
   ```
   📨 Webhook request received
   ✅ Webhook signature verified successfully
   ✅ Checkout session processed successfully
   ```

3. **Check Stripe Dashboard:**
   - Go to your webhook endpoint
   - Click on "Events" tab
   - You should see successful webhook deliveries

### 6. Webhook Events Handled

Your webhook handler processes these events:

- **`checkout.session.completed`** - When payment is successful
  - Updates order status to 'paid'
  - Saves order details to database
  - Stores image URLs

- **`payment_intent.succeeded`** - When payment is confirmed
  - Additional payment confirmation handling

- **`payment_intent.payment_failed`** - When payment fails
  - Logs the failure for review

### 7. Troubleshooting

**Webhook not receiving events?**
- Check that your server is running
- Verify the webhook URL is correct
- Check firewall/network settings
- Use Stripe CLI to test: `stripe listen --forward-to localhost:3001/api/webhook`

**"Webhook signature verification failed" error?**
- Make sure `STRIPE_WEBHOOK_SECRET` is set correctly in `.env`
- The secret from Stripe Dashboard must match exactly
- If using Stripe CLI, use the secret it provides (different from Dashboard)

**Webhook returns 500 error?**
- Check server logs for detailed error messages
- Verify Supabase credentials are set
- Check that database tables exist (run `database/schema.sql`)

### 8. Production Checklist

Before going live:

- [ ] Update webhook URL to production domain
- [ ] Get new webhook signing secret from production webhook endpoint
- [ ] Update `STRIPE_WEBHOOK_SECRET` in production `.env`
- [ ] Test webhook with a real payment
- [ ] Monitor webhook delivery in Stripe Dashboard
- [ ] Set up webhook retry notifications (Stripe Dashboard → Webhooks → Settings)

### Quick Reference

**Local Development URL:**
```
http://localhost:3001/api/webhook
```

**Stripe CLI Command:**
```bash
stripe listen --forward-to localhost:3001/api/webhook
```

**Required Environment Variable:**
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Webhook Events:**
- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

