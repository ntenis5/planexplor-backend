// src/routes/payments.ts

import { Router, Request, Response } from 'express'; 
import Stripe from 'stripe';
// ✅ Shtuar .js për shkak të konfigurimit NodeNext
import { supabase } from '../services/supabaseClient.js';

// --- Tipi për trupin e kërkesës POST /create-intent ---
interface CreateIntentBody {
  package_type: 'mini' | 'standard' | 'custom'; // Përfshijmë 'standard' nga 'ads.ts'
  custom_views?: number;
  campaign_id: string; // ID e fushatës së krijuar (pending_payment)
}

// Përdorim Router-in e saktë
const paymentsRouter = Router(); 

// Inicializimi i Stripe me API-version më të ri
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20', // Përdorim versionin aktual
});

// ----------------------------------------------------------------------------------
// ENDPOINT: POST /api/payments/create-intent
// Krijon intent-in e pagesës (PaymentIntent)
// ----------------------------------------------------------------------------------
paymentsRouter.post('/create-intent', async (req: Request<{}, {}, CreateIntentBody>, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { package_type, custom_views, campaign_id } = req.body;

    if (!token) {
      return res.status(401).json({ error: 'Nuk u ofrua token-i i autentifikimit.' });
    }
    if (!campaign_id) {
         return res.status(400).json({ error: 'ID e fushatës është e nevojshme.' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Token-i i pavlefshëm.' });
    }

    // Llogarit shumat bazuar në paketa
    let amount = 0; // në cent
    let views_count = 0;
    const PRICE_PER_VIEW = 50; // 0.50€ në cent
    const STANDARD_PRICE_PER_VIEW = 45; // 0.45€ në cent

    if (package_type === 'mini') {
      amount = 2000; // 20€
      views_count = 40;
    } else if (package_type === 'standard') {
        amount = 9000; // 90€
        views_count = 200;
    } else if (package_type === 'custom' && custom_views && custom_views > 0) {
      views_count = custom_views;
      amount = Math.round(custom_views * PRICE_PER_VIEW); // 0.50€/view
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
      // Ruaj metadata për përdorim në webhook
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
// Trajton ngjarjet nga Stripe (Webhooks)
// ----------------------------------------------------------------------------------
// Kujdes: Ky endpoint duhet të ketë express.raw() si middleware lokal
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

  // Trajto ngjarjen
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent; 
      await handleSuccessfulPayment(paymentIntent);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  // Kthe përgjigje 200 për Stripe
  res.json({ received: true });
});

// ----------------------------------------------------------------------------------
// Funksioni KRYESOR: Përditëson Supabase pas Pagesës së Sukseshme
// ----------------------------------------------------------------------------------
async function handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { user_id, views_count, campaign_id } = paymentIntent.metadata;

    // 1. Përditëso statusin e pagesës
    await supabase
      .from('payments')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
        stripe_latest_charge_id: paymentIntent.latest_charge as string // ruaj charge id
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    // 2. Aktivizo fushatën e reklamave
    if (campaign_id) {
      await supabase
        .from('ad_campaigns')
        .update({
          status: 'active', // ✅ Kjo është kritike
          activated_at: new Date().toISOString(),
          // Mund të ruash edhe PIID në fushatë për gjurmim
          stripe_payment_intent_id: paymentIntent.id
        })
        .eq('id', campaign_id);
    }

    console.log(`Payment successful: Campaign ${campaign_id} activated.`);

  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

export default paymentsRouter;
