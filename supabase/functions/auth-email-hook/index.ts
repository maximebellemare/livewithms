import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { parseEmailWebhookPayload } from 'npm:@lovable.dev/email-js'
import { WebhookError, verifyWebhookRequest } from 'npm:@lovable.dev/webhooks-js'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { SignupEmail } from '../_shared/email-templates/signup.tsx'
import { InviteEmail } from '../_shared/email-templates/invite.tsx'
import { MagicLinkEmail } from '../_shared/email-templates/magic-link.tsx'
import { RecoveryEmail } from '../_shared/email-templates/recovery.tsx'
import { EmailChangeEmail } from '../_shared/email-templates/email-change.tsx'
import { ReauthenticationEmail } from '../_shared/email-templates/reauthentication.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-lovable-signature, x-lovable-timestamp, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// ── Branding ──────────────────────────────────────────────
const SITE_NAME = 'LiveWithMS'
const FROM_ADDRESS = `${SITE_NAME} <support@livewithms.com>`
const ROOT_DOMAIN = 'app.livewithms.com'
const RESEND_GATEWAY = 'https://connector-gateway.lovable.dev/resend'

const EMAIL_SUBJECTS: Record<string, string> = {
  signup: 'Welcome to LiveWithMS – Confirm your email',
  invite: "You've been invited to LiveWithMS",
  magiclink: 'Your LiveWithMS sign-in link',
  recovery: 'LiveWithMS – Reset your password',
  email_change: 'LiveWithMS – Confirm your new email',
  reauthentication: 'Your LiveWithMS verification code',
}

const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
}

// ── Preview (sample data) ─────────────────────────────────
const SAMPLE_PROJECT_URL = 'https://app-livewithms-com.lovable.app'
const SAMPLE_EMAIL = 'user@example.test'
const SAMPLE_DATA: Record<string, object> = {
  signup: { siteName: SITE_NAME, siteUrl: SAMPLE_PROJECT_URL, recipient: SAMPLE_EMAIL, confirmationUrl: SAMPLE_PROJECT_URL },
  magiclink: { siteName: SITE_NAME, confirmationUrl: SAMPLE_PROJECT_URL },
  recovery: { siteName: SITE_NAME, confirmationUrl: SAMPLE_PROJECT_URL },
  invite: { siteName: SITE_NAME, siteUrl: SAMPLE_PROJECT_URL, confirmationUrl: SAMPLE_PROJECT_URL },
  email_change: { siteName: SITE_NAME, email: SAMPLE_EMAIL, newEmail: SAMPLE_EMAIL, confirmationUrl: SAMPLE_PROJECT_URL },
  reauthentication: { token: '123456' },
}

// ── Preview handler ───────────────────────────────────────
async function handlePreview(req: Request): Promise<Response> {
  const previewCors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
  }
  if (req.method === 'OPTIONS') return new Response(null, { headers: previewCors })

  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  if (!apiKey || req.headers.get('Authorization') !== `Bearer ${apiKey}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...previewCors, 'Content-Type': 'application/json' },
    })
  }

  let type: string
  try { type = (await req.json()).type } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...previewCors, 'Content-Type': 'application/json' },
    })
  }

  const Template = EMAIL_TEMPLATES[type]
  if (!Template) {
    return new Response(JSON.stringify({ error: `Unknown type: ${type}` }), {
      status: 400, headers: { ...previewCors, 'Content-Type': 'application/json' },
    })
  }

  const html = await renderAsync(React.createElement(Template, SAMPLE_DATA[type] || {}))
  return new Response(html, {
    status: 200, headers: { ...previewCors, 'Content-Type': 'text/html; charset=utf-8' },
  })
}

// ── Send via Resend (connector gateway) ───────────────────
async function sendViaResend(
  to: string, subject: string, html: string, text: string
): Promise<{ success: boolean; error?: string }> {
  const lovableKey = Deno.env.get('LOVABLE_API_KEY')
  const resendKey = Deno.env.get('RESEND_API_KEY')

  if (!lovableKey || !resendKey) {
    return { success: false, error: 'Missing LOVABLE_API_KEY or RESEND_API_KEY' }
  }

  const res = await fetch(`${RESEND_GATEWAY}/emails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${lovableKey}`,
      'X-Connection-Api-Key': resendKey,
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [to],
      subject,
      html,
      text,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('Resend API error', { status: res.status, body })
    return { success: false, error: `Resend ${res.status}: ${body}` }
  }

  return { success: true }
}

// ── Webhook handler ───────────────────────────────────────
async function handleWebhook(req: Request): Promise<Response> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  if (!apiKey) {
    console.error('LOVABLE_API_KEY not configured')
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Verify webhook signature
  let payload: any
  let run_id = ''
  try {
    const verified = await verifyWebhookRequest({ req, secret: apiKey, parser: parseEmailWebhookPayload })
    payload = verified.payload
    run_id = payload.run_id
  } catch (error) {
    if (error instanceof WebhookError) {
      const status = ['invalid_signature', 'missing_timestamp', 'invalid_timestamp', 'stale_timestamp'].includes(error.code) ? 401 : 400
      console.error('Webhook error', { code: error.code, message: error.message })
      return new Response(JSON.stringify({ error: error.code }), {
        status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    console.error('Webhook verification failed', { error })
    return new Response(JSON.stringify({ error: 'Invalid webhook payload' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!run_id) {
    return new Response(JSON.stringify({ error: 'Missing run_id' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  if (payload.version !== '1') {
    return new Response(JSON.stringify({ error: `Unsupported version: ${payload.version}` }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const emailType = payload.data.action_type
  const recipientEmail = payload.data.email
  console.log('Auth email event', { emailType, email: recipientEmail, run_id })

  const Template = EMAIL_TEMPLATES[emailType]
  if (!Template) {
    console.error('Unknown email type', { emailType, run_id })
    return new Response(JSON.stringify({ error: `Unknown email type: ${emailType}` }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Build template props
  const templateProps = {
    siteName: SITE_NAME,
    siteUrl: `https://${ROOT_DOMAIN}`,
    recipient: recipientEmail,
    confirmationUrl: payload.data.url,
    token: payload.data.token,
    email: recipientEmail,
    newEmail: payload.data.new_email,
  }

  // Render email
  const html = await renderAsync(React.createElement(Template, templateProps))
  const text = await renderAsync(React.createElement(Template, templateProps), { plainText: true })
  const subject = EMAIL_SUBJECTS[emailType] || 'Notification'

  // Send via Resend
  const result = await sendViaResend(recipientEmail, subject, html, text)

  // Log to email_send_log for observability
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    await supabase.from('email_send_log').insert({
      message_id: crypto.randomUUID(),
      template_name: emailType,
      recipient_email: recipientEmail,
      status: result.success ? 'sent' : 'failed',
      error_message: result.error || null,
    })
  } catch (logErr) {
    console.error('Failed to log email send', logErr)
  }

  if (!result.success) {
    console.error('Email send failed', { emailType, error: result.error, run_id })
    return new Response(JSON.stringify({ error: 'Failed to send email' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  console.log('Auth email sent via Resend', { emailType, email: recipientEmail, run_id })
  return new Response(JSON.stringify({ success: true }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// ── Router ────────────────────────────────────────────────
Deno.serve(async (req) => {
  const url = new URL(req.url)
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (url.pathname.endsWith('/preview')) return handlePreview(req)

  try {
    return await handleWebhook(req)
  } catch (error) {
    console.error('Webhook handler error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
