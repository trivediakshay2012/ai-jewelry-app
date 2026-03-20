/// <reference lib="deno.ns" />

import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@17.7.0'

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const appBaseUrl = (Deno.env.get('APP_BASE_URL') || 'http://localhost:8081').replace(/\/$/, '')

if (!stripeSecretKey) throw new Error('Missing STRIPE_SECRET_KEY')
if (!supabaseUrl) throw new Error('Missing SUPABASE_URL')
if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

const stripe = new Stripe(stripeSecretKey)
const supabase = createClient(supabaseUrl, serviceRoleKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

function defaultReturnUrl(status: 'success' | 'cancelled', leadId?: string | null) {
  const query = new URLSearchParams({ status })
  if (leadId) query.set('leadId', String(leadId))
  return `${appBaseUrl}/payment-center?${query.toString()}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const {
      paymentRequestId,
      leadId,
      orderNumber,
      paymentType,
      amount,
      currency,
      customerEmail,
      customerName,
      designTitle,
      successUrl,
      cancelUrl,
    } = body || {}

    if (!paymentRequestId) throw new Error('paymentRequestId is required')
    if (!amount || Number(amount) <= 0) throw new Error('amount must be greater than 0')

    const metadata = {
      payment_request_id: String(paymentRequestId),
      lead_id: String(leadId || ''),
      order_number: String(orderNumber || ''),
      payment_type: String(paymentType || 'deposit'),
      customer_email: String(customerEmail || ''),
      customer_name: String(customerName || ''),
      design_title: String(designTitle || ''),
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: successUrl || defaultReturnUrl('success', leadId),
      cancel_url: cancelUrl || defaultReturnUrl('cancelled', leadId),
      customer_email: customerEmail || undefined,
      metadata,
      payment_intent_data: { metadata },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: String(currency || 'usd').toLowerCase(),
            unit_amount: Math.round(Number(amount) * 100),
            product_data: {
              name: `${designTitle || 'Custom Jewelry'} — ${String(paymentType || 'deposit').replace(/_/g, ' ')}`,
              description: customerName ? `Customer: ${customerName}` : undefined,
            },
          },
        },
      ],
    })

    await supabase
      .from('payment_requests')
      .update({ status: 'checkout_created', memo: `Stripe session ${session.id}` })
      .eq('id', paymentRequestId)

    return new Response(JSON.stringify({ id: session.id, url: session.url }), {
      status: 200,
      headers: corsHeaders,
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: corsHeaders },
    )
  }
})
