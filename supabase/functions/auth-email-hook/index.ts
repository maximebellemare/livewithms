import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const FROM_ADDRESS = "LiveWithMS <support@livewithms.com>";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY is not configured");
    return new Response(
      JSON.stringify({ error: "Server misconfiguration: missing LOVABLE_API_KEY" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not configured");
    return new Response(
      JSON.stringify({ error: "Server misconfiguration: missing RESEND_API_KEY" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const payload = await req.json();
    const { user, email_data } = payload;

    const recipientEmail = user?.email;
    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ error: "No recipient email found" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const emailType = email_data?.token_hash ? determineEmailType(email_data) : "confirmation";
    const { subject, html } = buildEmail(emailType, email_data, recipientEmail);

    console.log(`Sending ${emailType} email to ${recipientEmail}`);

    const response = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [recipientEmail],
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`Resend API error [${response.status}]:`, JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: `Email send failed: ${response.status}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Email sent successfully: ${data.id}`);
    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in auth-email-hook:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

function determineEmailType(email_data: any): string {
  const redirectTo = email_data?.redirect_to || "";
  const tokenHash = email_data?.token_hash || "";
  const emailAction = email_data?.email_action_type || "";

  if (emailAction === "signup" || emailAction === "confirmation") return "confirmation";
  if (emailAction === "recovery" || emailAction === "reset_password") return "recovery";
  if (emailAction === "magic_link" || emailAction === "magiclink") return "magic_link";
  if (emailAction === "invite") return "invite";
  if (emailAction === "email_change") return "email_change";

  if (redirectTo.includes("reset-password") || redirectTo.includes("recovery")) return "recovery";
  if (redirectTo.includes("magic")) return "magic_link";

  return "confirmation";
}

function buildEmail(
  type: string,
  email_data: any,
  recipientEmail: string
): { subject: string; html: string } {
  const confirmationUrl = email_data?.confirmation_url || email_data?.action_link || "#";
  const appName = "LiveWithMS";

  const baseStyles = `
    body { margin: 0; padding: 0; background-color: #FBF9F7; font-family: 'DM Sans', Arial, sans-serif; }
    .container { max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, hsl(25,85%,50%), hsl(25,85%,42%)); padding: 32px 24px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 28px; margin: 0; font-weight: 700; }
    .header .emoji { font-size: 40px; display: block; margin-bottom: 8px; }
    .body { padding: 32px 24px; }
    .body h2 { color: #121212; font-size: 22px; margin: 0 0 12px; font-weight: 600; }
    .body p { color: #404040; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
    .btn { display: inline-block; background: hsl(25,85%,50%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 999px; font-size: 16px; font-weight: 600; margin: 8px 0 24px; }
    .footer { padding: 20px 24px; text-align: center; border-top: 1px solid #f0ece8; }
    .footer p { color: #999; font-size: 12px; margin: 0; line-height: 1.5; }
    .muted { color: #777; font-size: 13px; }
  `;

  const wrap = (content: string) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${baseStyles}</style></head>
<body><div class="container">${content}
<div class="footer"><p>${appName} · Your data is encrypted and private</p><p>Need help? <a href="mailto:support@livewithms.com" style="color:hsl(25,85%,50%)">Contact support</a></p></div>
</div></body></html>`;

  switch (type) {
    case "confirmation":
      return {
        subject: `Welcome to ${appName} – Confirm your email`,
        html: wrap(`
          <div class="header"><span class="emoji">🧡</span><h1>${appName}</h1></div>
          <div class="body">
            <h2>Welcome aboard!</h2>
            <p>Thanks for joining ${appName}. Confirm your email to get started with tracking your health journey.</p>
            <a href="${confirmationUrl}" class="btn">Confirm Email</a>
            <p class="muted">If you didn't create an account, you can safely ignore this email.</p>
          </div>`),
      };

    case "recovery":
      return {
        subject: `${appName} – Reset your password`,
        html: wrap(`
          <div class="header"><span class="emoji">🔐</span><h1>${appName}</h1></div>
          <div class="body">
            <h2>Reset your password</h2>
            <p>We received a request to reset your password. Click the button below to choose a new one.</p>
            <a href="${confirmationUrl}" class="btn">Reset Password</a>
            <p class="muted">This link expires in 1 hour. If you didn't request this, you can safely ignore it.</p>
          </div>`),
      };

    case "magic_link":
      return {
        subject: `${appName} – Your sign-in link`,
        html: wrap(`
          <div class="header"><span class="emoji">✨</span><h1>${appName}</h1></div>
          <div class="body">
            <h2>Sign in to ${appName}</h2>
            <p>Click the button below to securely sign in. No password needed.</p>
            <a href="${confirmationUrl}" class="btn">Sign In</a>
            <p class="muted">This link expires in 10 minutes. If you didn't request this, you can safely ignore it.</p>
          </div>`),
      };

    case "invite":
      return {
        subject: `You've been invited to ${appName}`,
        html: wrap(`
          <div class="header"><span class="emoji">💌</span><h1>${appName}</h1></div>
          <div class="body">
            <h2>You're invited!</h2>
            <p>You've been invited to join ${appName}. Click below to accept and set up your account.</p>
            <a href="${confirmationUrl}" class="btn">Accept Invite</a>
          </div>`),
      };

    case "email_change":
      return {
        subject: `${appName} – Confirm email change`,
        html: wrap(`
          <div class="header"><span class="emoji">📧</span><h1>${appName}</h1></div>
          <div class="body">
            <h2>Confirm your new email</h2>
            <p>Click below to confirm changing your email address for your ${appName} account.</p>
            <a href="${confirmationUrl}" class="btn">Confirm Email Change</a>
            <p class="muted">If you didn't request this change, please contact support immediately.</p>
          </div>`),
      };

    default:
      return {
        subject: `${appName} – Action required`,
        html: wrap(`
          <div class="header"><span class="emoji">🧡</span><h1>${appName}</h1></div>
          <div class="body">
            <h2>Action required</h2>
            <p>Click the button below to continue.</p>
            <a href="${confirmationUrl}" class="btn">Continue</a>
          </div>`),
      };
  }
}
