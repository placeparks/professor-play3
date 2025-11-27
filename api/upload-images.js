// Image Upload API Endpoint
// Uploads card images to Supabase Storage and returns URLs

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Convert base64 to buffer
function base64ToBuffer(base64String) {
  // Remove data URL prefix if present
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

// Get file extension from base64 data URL
function getExtensionFromBase64(base64String) {
  const match = base64String.match(/^data:image\/(\w+);base64,/);
  return match ? match[1] : 'png';
}

// Upload images to Supabase Storage
async function uploadImagesToStorage(images, orderId, shippingAddress) {
  const uploadedUrls = [];
  const bucketName = 'order-images';
  
  // Create a folder structure: order-images/{orderId}/{timestamp}/
  const timestamp = Date.now();
  const folderPath = `${orderId}/${timestamp}`;
  
  // Use shipping address to create a subfolder for organization
  const addressHash = shippingAddress 
    ? `${shippingAddress.country}_${shippingAddress.postal_code?.replace(/\s+/g, '_') || 'unknown'}`
    : 'unknown';
  
  const addressFolder = `${folderPath}/${addressHash}`;

  for (let i = 0; i < images.length; i++) {
    try {
      const imageData = images[i];
      
      // Skip if already a URL (not base64)
      if (typeof imageData === 'string' && imageData.startsWith('http')) {
        uploadedUrls.push(imageData);
        continue;
      }
      
      // Convert base64 to buffer
      const buffer = base64ToBuffer(imageData);
      const extension = getExtensionFromBase64(imageData);
      const fileName = `${uuidv4()}.${extension}`;
      const filePath = `${addressFolder}/${fileName}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, buffer, {
          contentType: `image/${extension}`,
          upsert: false
        });
      
      if (error) {
        console.error(`Error uploading image ${i + 1}:`, error);
        // Continue with other images even if one fails
        continue;
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      if (urlData?.publicUrl) {
        uploadedUrls.push(urlData.publicUrl);
      } else {
        console.error(`Failed to get public URL for image ${i + 1}`);
      }
      
    } catch (error) {
      console.error(`Error processing image ${i + 1}:`, error);
      // Continue with next image
    }
  }
  
  return uploadedUrls;
}

// Main upload handler
async function uploadImages(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      images,
      orderId,
      shippingAddress
    } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Images array is required' });
    }

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Upload images to storage
    const imageUrls = await uploadImagesToStorage(
      images,
      orderId,
      shippingAddress
    );

    if (imageUrls.length === 0) {
      return res.status(500).json({ error: 'Failed to upload any images' });
    }

    return res.status(200).json({
      success: true,
      imageUrls,
      uploadedCount: imageUrls.length,
      totalCount: images.length
    });

  } catch (error) {
    console.error('Image upload error:', error);
    return res.status(500).json({
      error: 'Failed to upload images',
      message: error.message
    });
  }
}

module.exports = uploadImages;

