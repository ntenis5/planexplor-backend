import express, { Request, Response } from 'express'; 
import Stripe from 'stripe';
import { supabase } from '../services/supabaseClient.js';

interface CreateIntentBody {
  package_type: 'mini' | 'standard' | 'custom';
  custom_views?: number;
  campaign_id: string; 
}

const paymentsRouter = express.Router(); 

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
});

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

paymentsRouter.post('/create-intent', async (req: Request<{}, {}, CreateIntentBody>, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { package_type, custom_views, campaign_id } = req.body;

    if (!token || !campaign_id) {
      return res.status(400).json({ error: 'Token and campaign ID are required.' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token.' });
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
      return res.status(400).json({ error: 'Invalid package type or missing views.' });
    }
    
    let customerId: string;

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .limit(1)
      .single();

    if (existingProfile?.stripe_customer_id) {
      customerId = existingProfile.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id }
      });
      customerId = customer.id;
      
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

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

paymentsRouter.post('/webhook', express.raw({type: 'application/json'}), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature']!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.');
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
