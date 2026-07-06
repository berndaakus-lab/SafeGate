export interface SmsMessage {
  to: string;
  message: string;
}

export interface ISmsService {
  send(msg: SmsMessage): Promise<void>;
}
