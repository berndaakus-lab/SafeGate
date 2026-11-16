import { sendNewLeadAlertEmail } from "./email";
import { smsService } from "./sms";

type Lead = { schoolName: string; contactName: string; phone: string | null; email: string };

/**
 * Emails hello@verifygate.app and texts LEAD_ALERT_PHONE about a new lead.
 * Never throws: each channel logs its own failure so one can't stop the other.
 */
export async function notifyNewLead(lead: Lead) {
  const leadsUrl = `${process.env.NEXTAUTH_URL ?? "https://www.verifygate.app"}/superadmin/demo-requests`;
  const alertPhone = process.env.LEAD_ALERT_PHONE?.trim();

  const sms = `New VerifyGate lead: ${lead.schoolName}, ${lead.contactName}, ${lead.phone || "no phone"}. ${leadsUrl}`;

  const results = await Promise.allSettled([
    sendNewLeadAlertEmail({ ...lead, leadsUrl }),
    alertPhone
      ? smsService.send({ to: alertPhone, message: sms })
      : Promise.resolve(console.warn("[lead-alert] LEAD_ALERT_PHONE not set, skipping SMS")),
  ]);

  const [emailResult, smsResult] = results;
  if (emailResult.status === "rejected") console.error("[lead-alert] email failed:", emailResult.reason?.message);
  if (smsResult.status === "rejected") console.error("[lead-alert] SMS failed:", smsResult.reason?.message);
}
