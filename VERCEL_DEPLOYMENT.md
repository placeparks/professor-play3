# Vercel Deployment Guide

## Why Deploy to Vercel?

Deploying to Vercel should help resolve the Cloudflare 520 errors because:
- ✅ Better network infrastructure and reliability
- ✅ Closer proximity to Supabase servers
- ✅ Automatic HTTPS and CDN
- ✅ Better handling of concurrent requests
- ✅ More stable connections

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** (optional, for command-line deployment):
   ```bash
   npm i -g vercel
   ```

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Import Project in Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel will auto-detect the Node.js project

3. **Configure Environment Variables**:
   In Vercel Dashboard → Project Settings → Environment Variables, add:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your-service-key
   ALLOWED_ORIGINS=https://your-domain.vercel.app,https://your-custom-domain.com
   PORT=3001
   ```

4. **Deploy**: Click "Deploy"

### Option 2: Deploy via CLI

1. **Login to Vercel**:
   ```bash
   vercel login
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Set Environment Variables**:
   ```bash
   vercel env add STRIPE_SECRET_KEY
   vercel env add STRIPE_WEBHOOK_SECRET
   vercel env add SUPABASE_URL
   vercel env add SUPABASE_SERVICE_KEY
   vercel env add ALLOWED_ORIGINS
   ```

4. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

## Post-Deployment Configuration

### 1. Update Stripe Webhook URL

After deployment, update your Stripe webhook endpoint:

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Edit your webhook endpoint
3. Update the URL to: `https://your-app.vercel.app/api/webhook`
4. Save changes

### 2. Update Frontend API URL

If your frontend is separate, update the API URL in `index.html`:

```javascript
// Change from:
const API_URL = 'http://localhost:3001/api/checkout';

// To:
const API_URL = 'https://your-app.vercel.app/api/checkout';
```

### 3. Update CORS Settings

Update `ALLOWED_ORIGINS` in Vercel environment variables to include:
- Your Vercel app URL: `https://your-app.vercel.app`
- Your custom domain (if any): `https://yourdomain.com`
- Your frontend URL (if separate)

## Vercel Limits

### Request Body Size
- **Hobby Plan**: 4.5 MB
- **Pro Plan**: 4.5 MB
- **Enterprise**: Custom

**Note**: If you're sending large base64 images, consider:
- Uploading to Supabase Storage first (which we already do)
- Only sending URLs in the request body
- Using the reduced payload optimization we added

### Function Timeout
- **Hobby Plan**: 10 seconds
- **Pro Plan**: 60 seconds
- **Enterprise**: Custom

**Note**: The `vercel.json` is configured for 30 seconds max duration.

## Testing After Deployment

1. **Health Check**:
   ```
   https://your-app.vercel.app/health
   ```

2. **Test Checkout**:
   - Open your deployed app
   - Create a test order
   - Check Vercel function logs for errors

3. **Test Webhook**:
   - Use Stripe CLI to forward events:
     ```bash
     stripe listen --forward-to https://your-app.vercel.app/api/webhook
     ```
   - Or test via Stripe Dashboard

## Monitoring

- **Vercel Dashboard**: View function logs and metrics
- **Stripe Dashboard**: Monitor webhook events
- **Supabase Dashboard**: Check database and storage

## Troubleshooting

### Cloudflare 520 Errors Still Occurring

If you still see 520 errors after deployment:

1. **Check Payload Size**:
   - Look at function logs for payload size
   - If > 4MB, optimize by removing base64 from requests

2. **Check Function Timeout**:
   - If operations take > 10s (Hobby) or > 60s (Pro), optimize
   - Consider moving image uploads to client-side

3. **Check Network**:
   - Vercel functions run in multiple regions
   - Check which region your function is running in
   - Consider using Vercel Edge Functions for better latency

### Database Connection Issues

If Supabase connections fail:

1. **Check Environment Variables**: Ensure all are set correctly
2. **Check Supabase Status**: Visit [status.supabase.com](https://status.supabase.com)
3. **Check Network**: Vercel functions should have good connectivity

## Additional Optimizations

### 1. Use Edge Functions for Static Assets

Consider moving static files to Vercel Edge Network for faster delivery.

### 2. Optimize Image Uploads

The current implementation uploads images to Supabase Storage, which is good. Consider:
- Client-side uploads directly to Supabase (using signed URLs)
- This reduces server function execution time

### 3. Use Vercel Analytics

Enable Vercel Analytics to monitor:
- Function performance
- Error rates
- Request patterns

## Production Checklist

- [ ] All environment variables set in Vercel
- [ ] Stripe webhook URL updated
- [ ] CORS origins configured correctly
- [ ] Frontend API URLs updated
- [ ] Health check endpoint working
- [ ] Test checkout successful
- [ ] Webhook receiving events
- [ ] Database saves working
- [ ] Image uploads working
- [ ] Custom domain configured (optional)

## Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Stripe Docs**: [stripe.com/docs](https://stripe.com/docs)

