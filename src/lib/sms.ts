// Legacy re-export — kept for any existing imports.
// New code should import from "@/lib/sms" (the directory).
export { smsService } from "./sms/index";

import { smsService } from "./sms/index";

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
  const time = new Date().toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit" });
  const message =
    `VerifyGate: ${studentName} was picked up by ${collectedBy} at ${time} from ${schoolName}. ` +
    `If this was not authorised, call the school immediately!`;
  await smsService.send({ to: parentPhone, message });
}
