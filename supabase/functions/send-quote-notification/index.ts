/// <reference lib="deno.ns" />

import { createClient } from 'npm:@supabase/supabase-js@2'

type QuoteNotificationPayload = {
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
  designTitle?: string | null
  quoteAmount?: number | string | null
  depositPercent?: number | string | null
  timeline?: string | null
  vendorId?: string | null
  leadId?: string | null
  quoteId?: string | null
}

type NotificationInsertInput = {
  title: string
  body: string
  referenceId?: string | null
  recipientEmail?: string | null
  vendorId?: string | null
  metadata?: Record<string, unknown>
}

const appBaseUrl = (Deno.env.get('APP_BASE_URL') || 'https://www.aurra.us').replace(/\/$/, '')
const resendApiKey = Deno.env.get('RESEND_API_KEY') || ''
const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Aurra <quotes@aurra.us>'
const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID') || ''
const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN') || ''
const twilioFromPhone = Deno.env.get('TWILIO_FROM_PHONE') || ''
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

const supabase = supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null

function moneyLabel(value: number) {
  const amount = Number(value || 0)
  return `$${amount.toFixed(2)}`
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizePhone(input?: string | null) {
  if (!input) return null
  const trimmed = input.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('+')) return trimmed
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  return null
}

function jsonResponse(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: corsHeaders })
}

async function insertNotification(input: NotificationInsertInput) {
  if (!supabase) {
    return { ok: false, message: 'Supabase service role config missing; skipped notification insert' }
  }

  const { error } = await supabase.from('notification_events').insert({
    audience: 'customer',
    channel: 'in_app',
    title: input.title,
    body: input.body,
    reference_type: 'vendor_quote',
    reference_id: input.referenceId || null,
    recipient_email: input.recipientEmail || null,
    recipient_vendor_id: input.vendorId || null,
    metadata: input.metadata || null,
    status: 'unread',
    created_at: new Date().toISOString(),
  })

  if (error) {
    return { ok: false, message: `notification_events insert failed: ${error.message}` }
  }

  return { ok: true, message: 'In-app notification inserted' }
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!resendApiKey) {
    return { ok: false, message: 'RESEND_API_KEY missing' }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: [to],
      subject,
      html,
    }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = String((data as { message?: string })?.message || `Email send failed with status ${response.status}`)
    return { ok: false, message }
  }

  return { ok: true, message: 'Email sent', providerResponse: data }
}

async function sendSms(to: string, body: string) {
  if (!twilioAccountSid || !twilioAuthToken || !twilioFromPhone) {
    return { ok: false, message: 'Twilio config missing' }
  }

  const payload = new URLSearchParams({
    To: to,
    From: twilioFromPhone,
    Body: body,
  })

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: payload,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = String((data as { message?: string })?.message || `SMS send failed with status ${response.status}`)
    return { ok: false, message }
  }

  return { ok: true, message: 'SMS sent', providerResponse: data }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method === 'GET') {
    return jsonResponse({
      ok: true,
      function: 'send-quote-notification',
      config: {
        hasSupabaseUrl: Boolean(supabaseUrl),
        hasServiceRole: Boolean(serviceRoleKey),
        hasResendKey: Boolean(resendApiKey),
        hasResendFrom: Boolean(resendFromEmail),
        hasTwilioSid: Boolean(twilioAccountSid),
        hasTwilioToken: Boolean(twilioAuthToken),
        hasTwilioFromPhone: Boolean(twilioFromPhone),
        appBaseUrl,
      },
    })
  }

  try {
    const body = (await req.json()) as QuoteNotificationPayload
    const customerName = String(body.customerName || 'Customer').trim()
    const customerEmail = String(body.customerEmail || '').trim()
    const customerPhone = normalizePhone(body.customerPhone)
    const designTitle = String(body.designTitle || 'your custom jewelry request').trim()
    const quoteAmount = toNumber(body.quoteAmount)
    const depositPercent = toNumber(body.depositPercent, 50)
    const timeline = String(body.timeline || 'We will coordinate the next steps with you shortly.').trim()
    const leadId = body.leadId ? String(body.leadId) : null
    const quoteId = body.quoteId ? String(body.quoteId) : null
    const vendorId = body.vendorId ? String(body.vendorId) : null
    const depositAmount = quoteAmount * (depositPercent / 100)
    const reviewUrl = leadId
      ? `${appBaseUrl}/my-quotes?leadId=${encodeURIComponent(leadId)}${customerEmail ? `&customerEmail=${encodeURIComponent(customerEmail)}` : ''}${customerName ? `&customerName=${encodeURIComponent(customerName)}` : ''}`
      : `${appBaseUrl}/my-quotes${customerEmail ? `?customerEmail=${encodeURIComponent(customerEmail)}${customerName ? `&customerName=${encodeURIComponent(customerName)}` : ''}` : ''}`

    const title = 'Your Aurra jewelry quote is ready'
    const message = `Your quote for ${designTitle} is ready at ${moneyLabel(quoteAmount)}. Deposit due now: ${moneyLabel(depositAmount)}. Timeline: ${timeline}.`

    const diagnostics: string[] = []
    const inApp = await insertNotification({
      title,
      body: message,
      referenceId: quoteId || leadId,
      recipientEmail: customerEmail || null,
      vendorId,
      metadata: {
        leadId,
        quoteId,
        quoteAmount,
        depositPercent,
        timeline,
        customerName,
        customerEmail,
        customerPhone,
        designTitle,
        status: 'quoted',
      },
    })
    diagnostics.push(inApp.message)

    let emailSent = false
    let smsSent = false

    if (customerEmail) {
      const email = await sendEmail(
        customerEmail,
        title,
        `
          <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
            <h2>Your Aurra jewelry quote is ready</h2>
            <p>Hi ${customerName},</p>
            <p>Your quote for <strong>${designTitle}</strong> is ready.</p>
            <p><strong>Total quote:</strong> ${moneyLabel(quoteAmount)}<br />
            <strong>Deposit due now:</strong> ${moneyLabel(depositAmount)}<br />
            <strong>Estimated timeline:</strong> ${timeline}</p>
            <p>You can review your quote here:</p>
            <p><a href="${reviewUrl}">${reviewUrl}</a></p>
            <p>Thank you for designing with Aurra.</p>
          </div>
        `,
      )
      emailSent = email.ok
      diagnostics.push(email.message)
    } else {
      diagnostics.push('No customer email on lead')
    }

    if (customerPhone) {
      const sms = await sendSms(
        customerPhone,
        `Aurra: Your quote for ${designTitle} is ready at ${moneyLabel(quoteAmount)}. Deposit due now ${moneyLabel(depositAmount)}. Review: ${reviewUrl}`,
      )
      smsSent = sms.ok
      diagnostics.push(sms.message)
    } else {
      diagnostics.push('No valid customer phone for SMS')
    }

    return jsonResponse({
      ok: emailSent || inApp.ok,
      emailSent,
      smsSent,
      inAppInserted: inApp.ok,
      message: diagnostics.join(' • '),
    })
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      200,
    )
  }
})