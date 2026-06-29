import AfricasTalking from "africastalking";

const at = AfricasTalking({
  username: process.env.AT_USERNAME!,
  apiKey: process.env.AT_API_KEY!,
});

const sms = at.SMS;

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
    `If this was not authorised, call the school immediately.`;

  // Ensure phone is in international format for Ghana (+233)
  const phone = normalizeGhanaPhone(parentPhone);
  if (!phone) return;

  try {
    await sms.send({
      to: [phone],
      message,
      from: process.env.AT_SENDER_ID || "SafeGate",
    });
  } catch (err) {
    // SMS failure should never block the pickup confirmation
    console.error("SMS send failed:", err);
  }
}

function normalizeGhanaPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("233") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+233${digits.slice(1)}`;
  if (digits.length === 9) return `+233${digits}`;
  return null;
}
