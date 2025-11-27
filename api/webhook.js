// Vercel Serverless Function for Stripe Webhook
// This file is automatically routed by Vercel to /api/webhook
// It bypasses Express to ensure raw body is available for signature verification

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const handleWebhookEnhanced = require('./webhook-enhanced');

// Vercel serverless function handler
// Vercel automatically provides raw body when not using Express
module.exports = async (req, res) => {
  // On Vercel, when using a standalone serverless function (not Express),
  // the body comes as a Buffer or string by default
  // We need to ensure it's a Buffer for Stripe signature verification
  
  let rawBody = req.body;
  
  // Convert to Buffer if it's a string
  if (typeof rawBody === 'string') {
    rawBody = Buffer.from(rawBody, 'utf8');
  } else if (!Buffer.isBuffer(rawBody)) {
    // If body is an object, it was parsed as JSON (shouldn't happen)
    console.error('❌ Webhook body was parsed as JSON. Body type:', typeof rawBody);
    console.error('Body is Buffer:', Buffer.isBuffer(rawBody));
    console.error('Body keys:', rawBody && typeof rawBody === 'object' ? Object.keys(rawBody) : 'N/A');
    
    return res.status(400).json({
      error: 'Webhook payload must be provided as a string or a Buffer',
      code: 'INVALID_BODY_TYPE',
      message: 'Body was parsed as JSON. Vercel should provide raw body for serverless functions.',
      bodyType: typeof rawBody,
      isBuffer: Buffer.isBuffer(rawBody)
    });
  }

  // Create a mock req object with the raw body for the enhanced handler
  const mockReq = {
    ...req,
    body: rawBody,
    headers: req.headers || {}
  };

  // Pass to enhanced handler
  return handleWebhookEnhanced(mockReq, res);
};
