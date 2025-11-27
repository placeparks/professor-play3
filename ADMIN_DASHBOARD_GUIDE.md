# Admin Dashboard Guide - Image Display

## Overview

The system now saves **both front and back card images** to the database and Supabase Storage. This guide explains how to access and display these images in your admin dashboard.

## Database Schema

The `orders` table now includes:

- **`card_images`** (JSONB): Array of ALL image URLs (front + back combined)
- **`front_image_urls`** (JSONB): Array of front image URLs only
- **`back_image_urls`** (JSONB): Array of back image URLs only
- **`card_data`** (JSONB): Detailed card information with front/back URL mappings
- **`card_images_base64`** (JSONB): Backup base64 images (if storage upload failed)

## Image Organization

### Storage Structure

Images are stored in Supabase Storage (`order-images` bucket) with this structure:
```
order-images/
  {orderId}/
    {timestamp}/
      {country}_{postal_code}/
        card-1/
          front.png
          back.png
        card-2/
          front.png
          back.png
        card-3/
          front.png
          back.png
        ...
```

**Benefits:**
- Each card's front and back are stored together in the same folder
- Easy to identify which front image belongs to which back image
- Organized by card number for easy navigation

### Array Ordering

- **`card_images`**: `[front1, back1, front2, back2, front3, back3, ...]`
  - Images are paired: front and back for each card together
  - Pattern: `[card1Front, card1Back, card2Front, card2Back, ...]`
  - This matches the folder structure where each card's images are stored together

- **`front_image_urls`**: `[front1, front2, ...]`
  - Only front images, extracted from `card_images` array

- **`back_image_urls`**: `[back1, back2, ...]`
  - Only back images, extracted from `card_images` array (may be empty if no backs)

## Querying Orders

### Get All Orders with Images

```sql
SELECT 
  id,
  stripe_session_id,
  customer_email,
  customer_name,
  quantity,
  status,
  payment_status,
  front_image_urls,
  back_image_urls,
  card_images,
  created_at
FROM orders
ORDER BY created_at DESC;
```

### Get Orders with Back Images

```sql
SELECT 
  id,
  customer_email,
  quantity,
  front_image_urls,
  back_image_urls,
  jsonb_array_length(back_image_urls) as back_image_count
FROM orders
WHERE jsonb_array_length(back_image_urls) > 0
ORDER BY created_at DESC;
```

## Displaying Images in Admin Dashboard

### Example: JavaScript/TypeScript

```javascript
// Fetch order
const order = await fetch(`/api/orders/${orderId}`).then(r => r.json());

// Display front images
order.front_image_urls.forEach((url, index) => {
  const img = document.createElement('img');
  img.src = url;
  img.alt = `Front ${index + 1}`;
  // Add to DOM
});

// Display back images
order.back_image_urls.forEach((url, index) => {
  const img = document.createElement('img');
  img.src = url;
  img.alt = `Back ${index + 1}`;
  // Add to DOM
});
```

### Example: React Component

```jsx
function OrderImages({ order }) {
  return (
    <div className="order-images">
      <div className="front-images">
        <h3>Front Images ({order.front_image_urls.length})</h3>
        {order.front_image_urls.map((url, i) => (
          <img key={i} src={url} alt={`Front ${i + 1}`} />
        ))}
      </div>
      
      {order.back_image_urls.length > 0 && (
        <div className="back-images">
          <h3>Back Images ({order.back_image_urls.length})</h3>
          {order.back_image_urls.map((url, i) => (
            <img key={i} src={url} alt={`Back ${i + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Example: Using card_data for Detailed View

```javascript
// card_data contains detailed information per card
order.card_data.forEach((card, index) => {
  console.log(`Card ${index + 1}:`);
  console.log(`  Front URL: ${card.frontUrl || card.front}`);
  console.log(`  Back URL: ${card.backUrl || card.back || 'No back'}`);
  console.log(`  Quantity: ${card.quantity}`);
  console.log(`  Trim: ${card.trimMm}mm`);
  console.log(`  Bleed: ${card.bleedMm}mm`);
});
```

## API Endpoint Example

If you want to create an API endpoint for the admin dashboard:

```javascript
// GET /api/admin/orders/:id
app.get('/api/admin/orders/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', req.params.id)
    .single();
  
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  
  res.json({
    ...data,
    front_image_count: data.front_image_urls?.length || 0,
    back_image_count: data.back_image_urls?.length || 0,
    total_image_count: data.card_images?.length || 0
  });
});
```

## Image Access

All images are stored in a **public bucket**, so they can be accessed directly via URL:

```
https://{project}.supabase.co/storage/v1/object/public/order-images/{path}
```

No authentication required for viewing (read access is public).

## Migration

If you have existing orders without the new fields, you can migrate them:

```sql
-- Add new columns if they don't exist (already in schema.sql)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS front_image_urls JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS back_image_urls JSONB DEFAULT '[]'::jsonb;

-- For existing orders, you can extract front/back from card_data if available
-- (This would require custom logic based on your card_data structure)
```

## Notes

- **Back images are optional**: Some cards may not have back images
- **Base64 backup**: If storage upload fails, images are stored as base64 in `card_images_base64`
- **Image count**: `front_image_urls.length` should equal `quantity` (one front per card)
- **Back count**: `back_image_urls.length` may be less than `quantity` if some cards share a global back

