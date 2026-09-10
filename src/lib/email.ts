/**
 * Transactional email via Brevo's HTTP API.
 */

const FROM = { email: "hello@verifygate.app", name: "VerifyGate" };

async function sendEmail({
  to,
  toName,
  subject,
  html,
}: {
  to: string;
  toName?: string;
  subject: string;
  html: string;
}) {
  if (!process.env.BREVO_API_KEY) {
    console.warn("[email] BREVO_API_KEY not set, skipping send");
    return;
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: FROM,
      to: [{ email: to, name: toName }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo send failed (${res.status}): ${body}`);
  }
}

export async function sendDemoConfirmationEmail({
  to,
  contactName,
  schoolName,
}: {
  to: string;
  contactName: string;
  schoolName: string;
}) {
  await sendEmail({
    to,
    toName: contactName,
    subject: "We got your request - VerifyGate",
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; color: #1e293b;">
        <h2 style="color: #1d4ed8;">Thanks, ${contactName}!</h2>
        <p>We received your request to set up <strong>VerifyGate</strong> for <strong>${schoolName}</strong>.</p>
        <p>Our team will reach out within 24 hours to schedule a quick walkthrough and get your school set up, first month completely free, no card required.</p>
        <p>In a hurry? Reply to this email or WhatsApp us directly and we'll speed things up.</p>
        <p style="margin-top: 32px; color: #64748b; font-size: 13px;">The VerifyGate team</p>
      </div>
    `,
  });
}
