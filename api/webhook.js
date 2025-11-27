// Stripe Webhook Handler
// This handles Stripe webhook events to update order status and save final order details

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Update order in database after payment
async function updateOrderAfterPayment(session) {
  try {
    // Retrieve the full session with line items
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items', 'customer', 'shipping_details']
    });

    // Get order from database
    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('stripe_session_id', session.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching order:', fetchError);
    }

    // Prepare order update data
    const orderUpdate = {
      payment_status: session.payment_status,
      status: session.payment_status === 'paid' ? 'paid' : 'pending',
      customer_email: session.customer_details?.email || session.customer_email,
      customer_name: session.customer_details?.name,
      customer_phone: session.customer_details?.phone,
      shipping_address: session.shipping_details?.address || null,
      billing_address: session.customer_details?.address || null,
      total_amount_cents: session.amount_total,
      shipping_cost_cents: session.shipping_cost?.amount_total || null,
      updated_at: new Date().toISOString()
    };

    if (existingOrder) {
      // Update existing order
      const { data, error } = await supabase
        .from('orders')
        .update(orderUpdate)
        .eq('stripe_session_id', session.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating order:', error);
        throw error;
      }

      return data;
    } else {
      // Create new order if it doesn't exist
      const { data, error } = await supabase
        .from('orders')
        .insert({
          stripe_session_id: session.id,
          ...orderUpdate,
          quantity: parseInt(session.metadata?.quantity || '0'),
          price_per_card: parseFloat(session.metadata?.pricePerCard || '0'),
          shipping_country: session.metadata?.shippingCountry || session.shipping_details?.address?.country,
          card_images: session.metadata?.cardImages ? JSON.parse(session.metadata.cardImages) : [],
          card_images_base64: session.metadata?.cardImagesBase64 ? JSON.parse(session.metadata.cardImagesBase64) : [],
          card_data: session.metadata?.cardData ? JSON.parse(session.metadata.cardData) : [],
          image_storage_path: session.metadata?.imageStoragePath || null,
          metadata: session.metadata || {}
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error);
        throw error;
      }

      return data;
    }
  } catch (error) {
    console.error('Failed to update order after payment:', error);
    throw error;
  }
}

// Webhook handler
async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Checkout session completed:', session.id);
      
      try {
        await updateOrderAfterPayment(session);
        console.log('Order updated successfully:', session.id);
      } catch (error) {
        console.error('Failed to update order:', error);
        // Don't fail the webhook, but log the error
      }
      break;

    case 'payment_intent.succeeded':
      console.log('Payment succeeded:', event.data.object.id);
      break;

    case 'payment_intent.payment_failed':
      console.log('Payment failed:', event.data.object.id);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
}

module.exports = handleWebhook;

