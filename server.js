// Express server for TCGPlaytest API
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const createCheckoutSession = require('./api/checkout');
const handleWebhook = require('./api/webhook-enhanced');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:3001', 'null'],
  credentials: true
}));

// Webhook endpoint needs raw body for Stripe signature verification
// IMPORTANT: This must come BEFORE express.json() middleware
app.use('/api/webhook', express.raw({ type: 'application/json', limit: '10mb' }));

// All other endpoints use JSON with increased limit for image data
app.use(express.json({ limit: '50mb' })); // Increased limit to handle base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files (HTML, CSS, JS, images, etc.)
// Note: On Vercel, static files are served from the public directory automatically
app.use(express.static(path.join(__dirname)));
// Serve public folder for images and assets
app.use('/public', express.static(path.join(__dirname, 'public')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.post('/api/checkout', createCheckoutSession);
app.post('/api/webhook', handleWebhook);
app.post('/api/upload-images', require('./api/upload-images'));

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve success.html
app.get('/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'success.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Validate environment variables on startup
function validateEnvironment() {
  const required = ['STRIPE_SECRET_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\n⚠️  Please check your .env file!');
    return false;
  }
  
  console.log('✅ Environment variables validated');
  return true;
}

// Export for Vercel serverless functions
module.exports = app;

// Start server only if not in Vercel environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Health check: http://localhost:${PORT}/health`);
    console.log(`💳 Checkout API: http://localhost:${PORT}/api/checkout`);
    console.log(`🔔 Webhook: http://localhost:${PORT}/api/webhook`);
    console.log(`🌐 Frontend: http://localhost:${PORT}/`);
    console.log(`\n✨ Open http://localhost:${PORT}/ in your browser to use the app!`);
    
    // Validate environment after server starts
    if (!validateEnvironment()) {
      console.warn('\n⚠️  Server started but may not function correctly without proper configuration.');
    }
  });
} else {
  // In Vercel, validate environment on module load
  validateEnvironment();
}

