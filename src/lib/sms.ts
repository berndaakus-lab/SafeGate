// Nkomo SMS Gateway — SafeGate
// Sender ID: register "SafeGate" at https://app.nkomosms.com

function toInternational(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  if (clean.startsWith("233")) return clean;
  if (clean.startsWith("0")) return "233" + clean.slice(1);
  return clean;
}

async function sendSMS({ to, message }: { to: string; message: string }) {
  const apiKey = process.env.NKOMO_API_KEY;
  const senderId = process.env.NKOMO_SENDER_ID || "SafeGate";

  if (!apiKey) {
    console.warn("[sms] NKOMO_API_KEY not set — skipping SMS");
    return;
  }

  try {
    const res = await fetch("https://app.nkomosms.com/api/v3/sms/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        sender_id: senderId,
        message,
        recipient: toInternational(to),
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error("[sms] Nkomo error:", res.status, body);
    }
  } catch (err: any) {
    // SMS failure should never block pickup confirmation
    console.error("[sms] Network error:", err.message);
  }
}

export async function sendPickupSMS({
  parentPhone,
  studentName,
  collectedBy,
  schoolName,
}: {
  parentPhone: string;
  studentName: string;
  collectedBy: string;
  schoolName: string;
}) {
  const time = new Date().toLocaleTimeString("en-GH", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const message =
    `SafeGate: ${studentName} was picked up by ${collectedBy} at ${time} from ${schoolName}. ` +
    `If this was not authorised, call the school immediately!`;

  await sendSMS({ to: parentPhone, message });
}
