// src/routes/payments.ts (VERSIONI FINAL DHE I ZGJIDHUR PËR GABIMIN TS2322)

import express, { Request, Response } from 'express'; 
import Stripe from 'stripe';
import { supabase } from '../services/supabaseClient.js';

// --- Tipi për trupin e kërkesës POST /create-intent ---
interface CreateIntentBody {
  package_type: 'mini' | 'standard' | 'custom';
  custom_views?: number;
  campaign_id: string; 
}

const paymentsRouter = express.Router(); 

// ✅ RREGULLIMI KRITIK I GABIMIT TS2322: Përdorim literal string-un '2023-08-16' që kompajlleri pret.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16' as Stripe.LatestApiVersion,
});

// ----------------------------------------------------------------------------------
// FUNKSIONI PËR WEBHOOK
// ----------------------------------------------------------------------------------
async function handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { views_count, campaign_id } = paymentIntent.metadata;

    await supabase
      .from('payments')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
        stripe_latest_charge_id: paymentIntent.latest_charge as string 
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (campaign_id) {
      await supabase
        .from('ad_campaigns')
        .update({
          status: 'active',
          activated_at: new Date().toISOString(),
          stripe_payment_intent_id: paymentIntent.id
        })
        .eq('id', campaign_id);
    }

    console.log(`Payment successful: Campaign ${campaign_id} activated.`);

  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

// ----------------------------------------------------------------------------------
// ENDPOINT: POST /api/payments/create-intent
// ----------------------------------------------------------------------------------
paymentsRouter.post('/create-intent', async (req: Request<{}, {}, CreateIntentBody>, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { package_type, custom_views, campaign_id } = req.body;

    if (!token || !campaign_id) {
      return res.status(400).json({ error: 'Token-i dhe ID e fushatës janë të nevojshme.' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Token-i i pavlefshëm.' });
    }

    let amount = 0;
    let views_count = 0;
    const PRICE_PER_VIEW = 50; 

    if (package_type === 'mini') {
      amount = 2000;
      views_count = 40;
    } else if (package_type === 'standard') {
        amount = 9000;
        views_count = 200;
    } else if (package_type === 'custom' && custom_views && custom_views > 0) {
      views_count = custom_views;
      amount = Math.round(custom_views * PRICE_PER_VIEW);
    } else {
      return res.status(400).json({ error: 'Lloji i paketës i pavlefshëm ose shikimet mungojnë.' });
    }
    
    // 1. Gjej/Krijo Stripe Customer ID
    let customerId: string;

    const { data: existingCustomer } = await supabase
      .from('payments')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .single();

    if (existingCustomer?.stripe_customer_id) {
      customerId = existingCustomer.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id }
      });
      customerId = customer.id;
    }

    // 2. Krijon Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'eur',
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      metadata: {
        user_id: user.id,
        package_type,
        views_count: views_count.toString(),
        campaign_id: campaign_id
      }
    });

    // 3. Regjistro pagesën fillestare (Pending)
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

// ----------------------------------------------------------------------------------
// ENDPOINT: POST /api/payments/webhook
// ----------------------------------------------------------------------------------
paymentsRouter.post('/webhook', express.raw({type: 'application/json'}), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature']!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.');
    // @ts-ignore
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent; 
      await handleSuccessfulPayment(paymentIntent);
  } else {
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

export default paymentsRouter;
