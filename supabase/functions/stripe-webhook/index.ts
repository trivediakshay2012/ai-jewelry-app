/// <reference lib="deno.ns" />

import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@17.7.0'

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!stripeSecretKey) throw new Error('Missing STRIPE_SECRET_KEY')
if (!stripeWebhookSecret) throw new Error('Missing STRIPE_WEBHOOK_SECRET')
if (!supabaseUrl) throw new Error('Missing SUPABASE_URL')
if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

const stripe = new Stripe(stripeSecretKey)
const supabase = createClient(supabaseUrl, serviceRoleKey)

const jsonHeaders = { 'Content-Type': 'application/json' }

type StripeMetadata = Record<string, string | undefined>

async function insertNotification(input: {
  title: string
  body: string
  referenceId: string | null
  customerEmail: string | null
}) {
  await supabase.from('notification_events').insert({
    audience: 'customer',
    channel: 'in_app',
    title: input.title,
    body: input.body,
    reference_type: 'payment',
    reference_id: input.referenceId,
    recipient_email: input.customerEmail,
    status: 'unread',
    created_at: new Date().toISOString(),
  })
}

async function markPaid(metadata: StripeMetadata) {
  const paymentRequestId = metadata.payment_request_id
  const orderNumber = metadata.order_number
  const paymentType = metadata.payment_type || 'deposit'
  const customerEmail = metadata.customer_email || null

  if (!paymentRequestId) return

  await supabase.from('payment_requests').update({ status: 'paid' }).eq('id', paymentRequestId)

  if (orderNumber) {
    const nextStatus = paymentType === 'full' ? 'paid' : 'deposit_paid'
    await supabase.from('vendor_orders').update({ status: nextStatus }).eq('order_number', orderNumber)
  }

  await insertNotification({
    title: paymentType === 'full' ? 'Full payment received' : 'Deposit received',
    body:
      paymentType === 'full'
        ? 'Your full payment was received successfully.'
        : 'Your deposit was received successfully.',
    referenceId: paymentRequestId,
    customerEmail,
  })
}

async function markFailed(metadata: StripeMetadata) {
  const paymentRequestId = metadata.payment_request_id
  const customerEmail = metadata.customer_email || null
  if (!paymentRequestId) return

  await supabase.from('payment_requests').update({ status: 'failed' }).eq('id', paymentRequestId)

  await insertNotification({
    title: 'Payment failed',
    body: 'Stripe reported that your payment did not complete. Please try again.',
    referenceId: paymentRequestId,
    customerEmail,
  })
}

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing Stripe signature' }), {
      status: 400,
      headers: jsonHeaders,
    })
  }

  const payload = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, stripeWebhookSecret)
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Webhook verification failed' }),
      { status: 400, headers: jsonHeaders },
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await markPaid((session.metadata || {}) as StripeMetadata)
        break
      }
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session
        await markPaid((session.metadata || {}) as StripeMetadata)
        break
      }
      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent
        await markPaid((intent.metadata || {}) as StripeMetadata)
        break
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent
        await markFailed((intent.metadata || {}) as StripeMetadata)
        break
      }
      default:
        break
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: jsonHeaders,
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Webhook processing failed' }),
      { status: 400, headers: jsonHeaders },
    )
  }
})
