import express from 'express';
import Stripe from 'stripe';
import { supabase } from '../services/supabaseClient.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover' as any // ← KJO ËSHTË KORREKTE!
});

// Create payment intent
router.post('/create-intent', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { package_type, custom_views, campaign_id } = req.body;

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Calculate amount based on package
    let amount = 0;
    let views_count = 0;

    if (package_type === 'mini') {
      amount = 2000; // 20€ in cents
      views_count = 40;
    } else if (package_type === 'custom' && custom_views) {
      views_count = custom_views;
      amount = Math.round(custom_views * 50); // 0.50€ per view in cents
    } else {
      return res.status(400).json({ error: 'Invalid package type or missing custom_views' });
    }

    // Create Stripe customer if not exists
    let customerId: string;

    const { data: existingCustomer } = await supabase
      .from('payments')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .single();

    if (existingCustomer?.stripe_customer_id) {
      customerId = existingCustomer.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id
        }
      });
      customerId = customer.id;
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'eur',
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        user_id: user.id,
        package_type,
        views_count: views_count.toString(),
        campaign_id: campaign_id || ''
      }
    });

    // Save payment record
    await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        stripe_payment_intent_id: paymentIntent.id,
        stripe_customer_id: customerId,
        amount: amount / 100,
        currency: 'eur',
        status: 'pending',
        package_type,
        views_purchased: views_count
      });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount,
      views_count
    });

  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Stripe webhook handler
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature']!;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handleSuccessfulPayment(paymentIntent);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({received: true});
});

async function handleSuccessfulPayment(paymentIntent: any) {
  try {
    const { user_id, package_type, views_count, campaign_id } = paymentIntent.metadata;

    // Update payment status
    await supabase
      .from('payments')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    // If there's a campaign_id, activate the campaign
    if (campaign_id) {
      await supabase
        .from('ad_campaigns')
        .update({
          status: 'active',
          activated_at: new Date().toISOString()
        })
        .eq('id', campaign_id);
    }

    console.log(`Payment successful for user ${user_id}, views: ${views_count}`);

  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

export default router;
