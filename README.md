# TCGPlaytest - Stripe Payment Integration with Image Storage

This project integrates Stripe payment processing with Supabase Storage for custom card orders, storing images in organized buckets associated with user addresses.

## Features

- ✅ Stripe Checkout integration
- ✅ **Supabase Storage buckets for image storage**
- ✅ **Images organized by order ID and shipping address**
- ✅ Volume-based pricing tiers:
  - Starter Deck (1-144 cards): $0.35/card
  - Playtest Set (145-500 cards): $0.30/card
  - Bulk Order (500+ cards): $0.26/card
- ✅ Shipping costs:
  - US: $6.95
  - Worldwide: $24.95
- ✅ Order details and image URLs stored in database
- ✅ Webhook handler for payment completion

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...  # Get from: https://dashboard.stripe.com/apikeys
STRIPE_WEBHOOK_SECRET=whsec_...  # Get from Stripe CLI or Dashboard webhook settings

# Supabase
SUPABASE_URL=https://your-project.supabase.co  # Replace with your actual Supabase URL
SUPABASE_SERVICE_KEY=your-service-role-key  # Get from Supabase Dashboard → Settings → API

# Server
PORT=3001
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

**⚠️ Important:** 
- Replace `your-project.supabase.co` with your actual Supabase project URL
- Get a fresh Stripe API key if you see "API key expired" error
- See `STRIPE_SETUP.md` for detailed instructions on getting API keys

### 2. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. **For new installations:** Run the SQL from `database/schema.sql` to create the orders table
4. **For existing databases:** Run the SQL from `database/migration-add-image-columns.sql` to add new columns
5. **Run the SQL from `database/storage-setup.sql` to create storage buckets and policies**

### 3. Storage Buckets

The storage setup creates two buckets:
- **`card-images`**: Currently **not used** in the code. Reserved for future use (e.g., card templates, public gallery, general card designs)
- **`order-images`**: **Currently used** for all order-specific images. Images are organized by:
  - Order ID
  - Timestamp
  - Shipping address (country + postal code)

**Image Organization Structure:**
```
order-images/
  └── {orderId}/
      └── {timestamp}/
          └── {country}_{postal_code}/
              ├── image1.png
              ├── image2.png
              └── ...
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

### 6. Stripe Webhook Setup

**For Local Development (Recommended):**

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3001/api/webhook`
4. Copy the webhook signing secret (starts with `whsec_...`) to your `.env` file:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

**Alternative: Using ngrok for Local Testing:**

1. Install ngrok: https://ngrok.com/download
2. Start your server: `npm start`
3. In another terminal: `ngrok http 3001`
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io/api/webhook`)
5. Add this URL in Stripe Dashboard → Webhooks
6. Copy the webhook signing secret to your `.env` file

**For Production:**

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy the webhook signing secret to your `.env` file

**See `WEBHOOK_SETUP.md` for detailed instructions.**

### 7. Update Frontend API URL

In `index.html`, update the checkout API endpoint if needed:

```javascript
const response = await fetch('/api/checkout', {
  // Change to your backend URL if different
  // e.g., 'https://your-api.com/api/checkout'
});
```

## Project Structure

```
.
├── api/
│   ├── checkout.js      # Stripe checkout session creation + image upload
│   ├── webhook.js       # Stripe webhook handler
│   └── upload-images.js # Standalone image upload endpoint
├── database/
│   ├── schema.sql       # Database schema
│   └── storage-setup.sql # Storage buckets and policies
├── index.html           # Main frontend file
├── success.html         # Success page after payment
├── server.js           # Express server
├── package.json        # Dependencies
└── README.md          # This file
```

## API Endpoints

### POST /api/checkout

Creates a Stripe checkout session and uploads images to storage.

**Request Body:**
```json
{
  "quantity": 100,
  "shippingAddress": {
    "email": "customer@example.com",
    "name": "John Doe",
    "line1": "123 Main St",
    "line2": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001",
    "country": "US"
  },
  "cardImages": ["data:image/png;base64,..."],
  "cardData": [...]
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

**What happens:**
1. Images are uploaded to Supabase Storage (`order-images` bucket)
2. Images are organized by order ID and shipping address
3. Image URLs are stored in the database
4. Base64 images are kept as backup in `card_images_base64` field
5. Stripe checkout session is created with image URLs

### POST /api/upload-images

Standalone endpoint for uploading images to storage.

**Request Body:**
```json
{
  "images": ["data:image/png;base64,..."],
  "orderId": "order_123",
  "shippingAddress": {...}
}
```

**Response:**
```json
{
  "success": true,
  "imageUrls": ["https://...supabase.co/storage/..."],
  "uploadedCount": 10,
  "totalCount": 10
}
```

### POST /api/webhook

Handles Stripe webhook events (called by Stripe, not directly).

## Database Schema

The `orders` table stores:
- Customer information
- Shipping address
- Order details (quantity, pricing)
- **`card_images`**: Array of image URLs from Supabase Storage
- **`card_images_base64`**: Backup array of base64 images
- **`image_storage_path`**: Path in storage bucket for organization
- Payment status
- Stripe session ID

## Image Storage

### Organization

Images are stored in Supabase Storage with the following structure:
- **Bucket**: `order-images`
- **Path**: `{orderId}/{timestamp}/{country}_{postal_code}/card-{number}/front.{ext}` and `back.{ext}`

**Example structure:**
```
order-images/
  cs_test_abc123/
    1764268345000/
      US_10001/
        card-1/
          front.png
          back.png
        card-2/
          front.png
          back.png
        card-3/
          front.png
          back.png
        card-4/
          front.png
          back.png
```

This allows:
- Easy lookup by order ID
- Organization by shipping address
- **Each card's front and back stored together** - easy to identify which front goes with which back
- Time-based organization for cleanup

### Access

- Images are stored in a **public bucket** for easy access
- URLs are generated automatically: `https://{project}.supabase.co/storage/v1/object/public/order-images/{path}`
- Images can be accessed directly via URL

### Backup

- Base64 images are stored in `card_images_base64` as a backup
- If storage upload fails, base64 images are used
- Both formats are stored for redundancy

## Testing

1. Use Stripe test mode keys
2. Use test card: `4242 4242 4242 4242`
3. Any future expiry date and CVC
4. Check Supabase Storage for uploaded images
5. Check Supabase database for saved orders and image URLs

## Production Checklist

- [ ] Switch to Stripe live keys
- [ ] Update webhook endpoint to production URL
- [ ] Set up proper CORS origins
- [ ] Enable HTTPS
- [ ] Set up error monitoring
- [ ] Test complete checkout flow
- [ ] Verify database storage
- [ ] **Verify image uploads to Supabase Storage**
- [ ] **Test image URL access**
- [ ] **Set up storage bucket cleanup policy (optional)**

## Support

For issues or questions, please check:
- Stripe Documentation: https://stripe.com/docs
- Supabase Documentation: https://supabase.com/docs
- Supabase Storage: https://supabase.com/docs/guides/storage
