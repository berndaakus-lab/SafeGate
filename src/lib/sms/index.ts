import { NkomoSmsService } from "./NkomoSmsService";
import type { ISmsService } from "./types";

// Swap this export to switch providers, nothing else in the app changes.
export const smsService: ISmsService = new NkomoSmsService();

export type { ISmsService, SmsMessage } from "./types";
