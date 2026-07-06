import type { ISmsService, SmsMessage } from "./types";

function toInternational(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  if (clean.startsWith("233")) return clean;
  if (clean.startsWith("0")) return "233" + clean.slice(1);
  return clean;
}

export class NkomoSmsService implements ISmsService {
  private apiKey: string;
  private senderId: string;

  constructor() {
    this.apiKey = process.env.NKOMO_API_KEY ?? "";
    this.senderId = process.env.NKOMO_SENDER_ID ?? "VerifyGate";
  }

  async send({ to, message }: SmsMessage): Promise<void> {
    if (!this.apiKey) throw new Error("NKOMO_API_KEY not set");

    const res = await fetch("https://app.nkomosms.com/api/v3/sms/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        sender_id: this.senderId,
        message,
        recipient: toInternational(to),
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`Nkomo ${res.status}: ${JSON.stringify(body)}`);
    }
  }
}
